/*
 * 湯気 - YUGE Sauna & Spa 神田 / 埋め込み予約フォーム
 *
 * GASデプロイ手順:
 * 1. Google Apps Scriptで新規プロジェクトを作成し、gas/Code.gsを貼り付ける
 * 2. 「デプロイ」→「新しいデプロイ」→種類「ウェブアプリ」を選択
 * 3. 「次のユーザーとして実行」＝自分／「アクセスできるユーザー」＝全員、でデプロイ
 */

const GAS_CONFIG = {
  endpoint: "https://script.google.com/macros/s/AKfycbx-9ankf0DsY13LauZCzXH-ijdPVNMPTzPIR5jFs5v4bfenxTLzPEXKxH-4EFzPkhcjgg/exec",
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reserve-form');
  const formSection = document.getElementById('reservation-form');
  const errorBox = document.getElementById('form-error');
  const successBox = document.getElementById('form-success');

  if (!form || !formSection) return;

  document.querySelectorAll('.price-btn[data-plan]').forEach((button) => {
    button.addEventListener('click', () => {
      const plan = button.dataset.plan;
      const radio = form.querySelector(`input[name="plan"][value="${plan}"]`);
      if (radio) {
        radio.checked = true;
        clearFieldError(radio.name);
      }
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.hidden = false;
  };

  const clearError = () => {
    errorBox.textContent = '';
    errorBox.hidden = true;
  };

  const getErrorElement = (name) => form.querySelector(`[data-error-for="${name}"]`);

  const setFieldError = (name, message) => {
    const input = form.querySelector(`[name="${name}"]`);
    const error = getErrorElement(name);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  };

  const clearFieldError = (name) => {
    const input = form.querySelector(`[name="${name}"]`);
    const error = getErrorElement(name);
    if (input) input.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = '';
      error.hidden = true;
    }
  };

  const clearAllFieldErrors = () => {
    form.querySelectorAll('[data-error-for]').forEach((error) => {
      error.textContent = '';
      error.hidden = true;
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.removeAttribute('aria-invalid'));
  };

  const isValidPhone = (value) => /^[0-9０-９+\-\s()]{8,20}$/.test(value);
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const CAMPAIGN_START_DATE = '2025-11-01';
  const CAMPAIGN_END_DATE = '2025-12-15';

  // プラン別の予約条件
  // 10周年パック：人数制限なし / 07:00〜23:00
  // ペア割：2名固定 / 07:00〜23:00
  // 朝活ととのい：人数制限なし / 07:00〜10:00

  const timeSelect = form.querySelector('[name="time"]');
  const peopleInput = form.querySelector('[name="people"]');
  const planInputs = form.querySelectorAll('[name="plan"]');

  const allTimeOptions = [
    '07:00', '08:00', '09:00', '10:00',
    '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  ];

  const updatePlanConstraints = () => {
    const selectedPlan =
      form.querySelector('[name="plan"]:checked')?.value || '';

    // ペア割は2名固定
    if (selectedPlan === 'pair') {
      peopleInput.value = '2';
      peopleInput.min = '2';
      peopleInput.max = '2';
      peopleInput.readOnly = true;
    } else {
      // 10周年パック・朝活ととのいは人数制限なし
      peopleInput.min = '1';
      peopleInput.removeAttribute('max');
      peopleInput.readOnly = false;

      // ペア割から別プランへ変更した場合
      if (peopleInput.value === '2') {
        peopleInput.value = '1';
      }
    }

    // 朝活は07:00〜10:00
    // その他は07:00〜23:00
    const allowedTimes = selectedPlan === 'morning'
      ? allTimeOptions.filter(
          (time) => time >= '07:00' && time <= '10:00'
        )
      : allTimeOptions;

    const currentTime = timeSelect.value;

    timeSelect.innerHTML =
      '<option value="">時間を選択してください</option>';

    allowedTimes.forEach((time) => {
      const option = document.createElement('option');
      option.value = time;
      option.textContent = time;
      timeSelect.appendChild(option);
    });

    // 現在の時間が変更後も有効なら維持
    // 無効になった場合は未選択に戻す
    timeSelect.value = allowedTimes.includes(currentTime)
      ? currentTime
      : '';

    clearFieldError('people');
    clearFieldError('time');
  };

  planInputs.forEach((input) => {
    input.addEventListener('change', updatePlanConstraints);
  });

  // 初期状態にも適用
  updatePlanConstraints();

  const validateForm = () => {
    clearAllFieldErrors();
    clearError();
    let valid = true;

    const data = new FormData(form);
    const plan = String(data.get('plan') || '').trim();
    const name = String(data.get('name') || '').trim();
    const tel = String(data.get('tel') || '').trim();
    const email = String(data.get('email') || '').trim();
    const date = String(data.get('date') || '').trim();
    const time = String(data.get('time') || '').trim();
    const people = Number(data.get('people'));
    const agreement = form.querySelector('[name="agreement"]');

    if (!plan) {
      setFieldError('plan', 'ご希望プランを選択してください。');
      valid = false;
    }
    if (!name) {
      setFieldError('name', 'お名前を入力してください。');
      valid = false;
    }
    if (!tel) {
      setFieldError('tel', '電話番号を入力してください。');
      valid = false;
    } else if (!isValidPhone(tel)) {
      setFieldError('tel', '電話番号の形式をご確認ください。');
      valid = false;
    }
    if (!email) {
      setFieldError('email', 'メールアドレスを入力してください。');
      valid = false;
    } else if (!isValidEmail(email)) {
      setFieldError('email', 'メールアドレスの形式をご確認ください。');
      valid = false;
    }
    if (!date) {
      setFieldError('date', '来店希望日を選択してください。');
      valid = false;
    } else if (date < CAMPAIGN_START_DATE || date > CAMPAIGN_END_DATE) {
      setFieldError('date', '来店希望日は2025年11月1日〜12月15日の期間で選択してください。');
      valid = false;
    }
    if (!time) {
      setFieldError('time', '来店希望時間を選択してください。');
      valid = false;
    }
    if (!Number.isInteger(people) || people < 1) {
      setFieldError('people', '人数は1名以上で入力してください。');
      valid = false;
    }

    // ペア割は2名固定
    if (plan === 'pair' && people !== 2) {
      setFieldError('people', 'ペア割は2名でのご予約です。');
      valid = false;
    }

    // 朝活ととのいは07:00〜10:00
    if (
      plan === 'morning' &&
      time &&
      (time < '07:00' || time > '10:00')
    ) {
      setFieldError(
        'time',
        '朝活ととのいは07:00〜10:00の時間帯でご予約ください。'
      );
      valid = false;
    }
    
    if (!agreement || !agreement.checked) {
      setFieldError('agreement', '利用規約・プライバシーポリシーへの同意が必要です。');
      valid = false;
    }

    return valid;
  };

  form.querySelectorAll('input, select, textarea').forEach((field) => {
    const eventName = field.type === 'radio' || field.type === 'checkbox' ? 'change' : 'input';
    field.addEventListener(eventName, () => {
      clearFieldError(field.name);
      clearError();
    });
    if (field.type !== 'radio' && field.type !== 'checkbox') {
      field.addEventListener('change', () => {
        clearFieldError(field.name);
        clearError();
      });
    }
  });

  // スマートフォンなど、ネイティブの日付ピッカーによっては
  // min/maxの範囲外の日付を一度入力できる場合があるため、
  // 日付変更時にもキャンペーン期間を即時チェックする。
  const validateDateRange = () => {
    const dateInput = form.querySelector('[name="date"]');
    if (!dateInput) return true;

    const date = dateInput.value;
    if (!date) {
      clearFieldError('date');
      dateInput.setCustomValidity('');
      return true;
    }

    if (date < CAMPAIGN_START_DATE || date > CAMPAIGN_END_DATE) {
      setFieldError(
        'date',
        '来店希望日は2025年11月1日〜12月15日の期間で選択してください。'
      );
      dateInput.setCustomValidity(
        '来店希望日は2025年11月1日〜12月15日の期間で選択してください。'
      );
      dateInput.value = '';
      return false;
    }

    clearFieldError('date');
    dateInput.setCustomValidity('');
    return true;
  };

  const dateInput = form.querySelector('[name="date"]');
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      clearError();
      validateDateRange();
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      showError('入力内容をご確認ください。');
      return;
    }

    const data = new FormData(form);
    const submitButton = form.querySelector('.form-submit');
    submitButton.disabled = true;
    submitButton.textContent = '送信しています…';

    try {
      // GAS Webアプリは独自のCORSヘッダーを返さないため mode:"no-cors" が必要。
      // no-corsではレスポンス本文・ステータスを読めないため、fetch自体がrejectしない限り送信成功とみなす。
      await fetch(GAS_CONFIG.endpoint, {
        method: 'POST',
        mode: 'no-cors',
        body: data,
      });

      form.hidden = true;
      successBox.hidden = false;
      successBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error(error);
      showError('送信に失敗しました。お手数ですが、03-1234-5678までお電話ください。');
      submitButton.disabled = false;
      submitButton.textContent = 'この内容で予約する';
    }
  });
});
