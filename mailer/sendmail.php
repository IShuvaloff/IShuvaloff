<?php
  use PHPMailer\PHPMailer\PHPMailer; // ! не знаю, что это значит
  use PHPMailer\PHPMailer\Exception;

  require 'phpmailer/src/Exception.php';
  require 'phpmailer/src/PHPMailer.php';

  $mail = new PHPMailer(true);
  $mail->CharSet = 'UTF-8';
  $mail->setLanguage('ru', 'phpmailer/language'); // ! подключение языка, чтобы ошибки выводились на русском
  $mail->IsHtml(true);

  // от кого письмо
  $mail->setFrom('requests@ishuvaloff.ru', 'IShuvaloff.ru');
  // кому письмо
  $mail->addAddress('i.a.shuvalov@gmail.com');
  // тема письма
  $mail->Subject = 'Получение данных от IShuvaloff.ru';

  // ? обработка данных письма
  // рука
  $hand = 'Правая';
  if ($_POST['hand'] == 'left') {
    $hand = 'Левая';
  }

  $body = '<h1>Встречайте супер письмо!</h1>';
  
  if (trim(!empty($_POST['name']))) {
    $body .= '<p><strong>Имя: </strong> '.$_POST['name'].'</p>';
  }
  if (trim(!empty($_POST['email']))) {
    $body .= '<p><strong>E-mail: </strong> '.$_POST['email'].'</p>';
  }
  if (trim(!empty($_POST['hand']))) {
    $body .= '<p><strong>Рука: </strong> '.$hand.'</p>';
  }
  if (trim(!empty($_POST['age']))) {
    $body .= '<p><strong>Возраст: </strong> '.$_POST['age'].'</p>';
  }
  if (trim(!empty($_POST['message']))) {
    $body .= '<p><strong>Сообщение: </strong> '.$_POST['message'].'</p>';
  }

  // прикрепить файл
  if (!empty($_FILES['image']['tmp_name'])) {
    // путь загрузки файла
    $filePath = __DIR__ . '/files/' . $_FILES['image']['name'];
    // грузим файл
    if (copy($_FILES['image']['tmp_name'], $filePath)) {
      $fileAttach = $filePath;
      $body .= '<p><strong>Фото в приложении</strong></p>';
      $mail->addAttachment($fileAttach);
    }
  }

  $mail->Body = $body;

  // отправляем
  if (!$mail->send()) {
    $message = 'Ошибка';
  } else {
    $message = 'Данные отправлены';
  }

  // формируем файл JSON
  $response = ['message' => $message];
  // возвращаем JSON с соответствующим заголовком в наш javascript
  header('Content-type: application/json');
  echo json_encode($response);
?>