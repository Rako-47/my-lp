/*
 * 湯気 - YUGE Sauna & Spa 神田 / 予約受付GAS
 *
 * デプロイ手順
 * 1. Google Apps Scriptの新規プロジェクトを作成し、このコードを貼り付ける
 * 2. 「デプロイ」→「新しいデプロイ」→種類「ウェブアプリ」を選択
 * 3. 「次のユーザーとして実行」＝自分／「アクセスできるユーザー」＝全員、に設定してデプロイ
 * 4. 発行されたURLはjs/reservation.jsのGAS_CONFIG.endpointに設定済みです。
 *
 * スプレッドシート
 * - ID: 1KsOLhk2kBIHUHjNKyhSirKeEer8YwbSm1JsCFGvXlDQ
 * - シート名: 予約一覧
 *
 * ※送信先メールアドレスは、
 *   hyperbt3905hibino@gmail.com に更新済み。
 */

const SPREADSHEET_ID = '1KsOLhk2kBIHUHjNKyhSirKeEer8YwbSm1JsCFGvXlDQ';
const SHEET_NAME = '予約一覧';
const NOTIFICATION_EMAIL = 'hyperbt3905hibino@gmail.com';

/**
 * LPから予約情報を受け取り、
 * ①スプレッドシート保存 → ②メール通知 → ③結果返却
 * の順で処理します。
 */
function doPost(e) {
  var params = e.parameter || {};
  var reservationId = '';
  var saved = false;
  var emailSent = false;
  var errorMessage = '';

  try {
    // ① 予約番号を発行
    reservationId = generateReservationId();

    // ② スプレッドシートへ保存
    saveReservationToSheet(reservationId, params, '処理中', '');
    saved = true;

    // ③ メール通知
    var subject = '【湯気LP】新規予約：' + (params.plan || '');
    var body =
      '予約番号：' + reservationId + '\n' +
      'プラン：' + (params.plan || '') + '\n' +
      'お名前：' + (params.name || '') + '\n' +
      '電話番号：' + (params.tel || '') + '\n' +
      'メールアドレス：' + (params.email || '') + '\n' +
      '来店希望日：' + (params.date || '') + '\n' +
      '来店希望時間：' + (params.time || '') + '\n' +
      '人数：' + (params.people || '') + '\n' +
      'クーポンコード：' + (params.coupon || '') + '\n' +
      '備考：' + (params.note || '');

    try {
      MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
      emailSent = true;

      updateReservationStatus(reservationId, '完了', '成功');

    } catch (emailError) {
      errorMessage = emailError && emailError.message
        ? emailError.message
        : String(emailError);

      updateReservationStatus(
        reservationId,
        'メール送信失敗',
        '失敗',
        errorMessage
      );
    }

    // ④ 処理結果をLPへ返す
    if (saved && emailSent) {
      return createJsonResponse({
        success: true,
        saved: true,
        emailSent: true,
        reservationId: reservationId,
        message: '予約を受け付けました。'
      });
    }

    return createJsonResponse({
      success: false,
      saved: true,
      emailSent: false,
      reservationId: reservationId,
      message: '予約情報は受け付けましたが、店舗への通知処理に失敗しました。'
    });

  } catch (error) {
    errorMessage = error && error.message
      ? error.message
      : String(error);

    if (reservationId && saved) {
      try {
        updateReservationStatus(
          reservationId,
          '処理失敗',
          '',
          errorMessage
        );
      } catch (statusError) {
        // ステータス更新自体の失敗は、元のエラーを優先します。
      }
    }

    return createJsonResponse({
      success: false,
      saved: saved,
      emailSent: emailSent,
      reservationId: reservationId,
      message: '予約処理中にエラーが発生しました。'
    });
  }
}

/**
 * 予約情報をスプレッドシートへ1行追加します。
 * シートが空の場合はヘッダーも自動作成します。
 */
function saveReservationToSheet(reservationId, params, status, errorMessage) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('シート「' + SHEET_NAME + '」が見つかりません。');
  }

  ensureHeader(sheet);

  sheet.appendRow([
    reservationId,
    new Date(),
    params.plan || '',
    params.name || '',
    params.tel || '',
    params.email || '',
    params.date || '',
    params.time || '',
    params.people || '',
    params.coupon || '',
    params.note || '',
    status || '',
    '',
    errorMessage || ''
  ]);
}

/**
 * 1行目に必要なヘッダーがなければ作成します。
 */
function ensureHeader(sheet) {
  var headers = [
    '予約番号',
    '受付日時',
    'プラン',
    'お名前',
    '電話番号',
    'メールアドレス',
    '来店希望日',
    '来店希望時間',
    '人数',
    'クーポンコード',
    '備考',
    '処理結果',
    'メール通知',
    'エラー内容'
  ];

  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var hasHeader = firstRow.some(function(value) {
    return value !== '';
  });

  if (!hasHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

/**
 * 保存済み予約の処理結果を更新します。
 */
function updateReservationStatus(reservationId, status, mailStatus, errorMessage) {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('シート「' + SHEET_NAME + '」が見つかりません。');
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    throw new Error('予約データが見つかりません。');
  }

  var reservationIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (var i = 0; i < reservationIds.length; i++) {
    if (reservationIds[i][0] === reservationId) {
      var row = i + 2;

      // L列：処理結果
      sheet.getRange(row, 12).setValue(status);

      // M列：メール通知
      sheet.getRange(row, 13).setValue(mailStatus || '');

      // N列：エラー内容
      sheet.getRange(row, 14).setValue(errorMessage || '');

      return;
    }
  }

  throw new Error('予約番号「' + reservationId + '」が見つかりません。');
}

/**
 * 予約番号を生成します。
 * 例：YUGE-20260917-143025-482
 */
function generateReservationId() {
  var now = new Date();
  var yyyy = now.getFullYear();
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var dd = String(now.getDate()).padStart(2, '0');
  var hh = String(now.getHours()).padStart(2, '0');
  var min = String(now.getMinutes()).padStart(2, '0');
  var ss = String(now.getSeconds()).padStart(2, '0');
  var random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return 'YUGE-' + yyyy + mm + dd + '-' + hh + min + ss + '-' + random;
}

/**
 * JSONレスポンスを生成します。
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
