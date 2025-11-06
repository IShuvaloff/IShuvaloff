"use strict" // ! строгий режим, для совместимости с новыми функциями ECMAScript 5

// ? проверка на то, что документ загружен не дожидаясь прогрузки стилей и изображений (их хар-ки неизвестны)
document.addEventListener( 'DOMContentLoaded', function() {
  const form = document.getElementById('form');
  form.addEventListener('submit', formSend); // ! при нажатии на submit перейти на форму с id=formSend

  const formImage = document.getElementById('formImage');
  const formPreview = document.getElementById('formPreview');
  formImage.addEventListener('change', () => { // ! срабатывает каждый раз при выборе нового файла в input formImage
    uploadFile(formImage.files[0]);
  });

  // ----------------------------------- далее идут функции -----------------------------------

  // ? проверка и отправка данных
  // ? асинхронность нужна, чтобы сразу после отправки запроса продолжить выполнение js-кода и заменить экран вращающимся символом loading
  async function formSend(e) {
    e.preventDefault(); // ! не выполнять действия нажатия submit по умолчанию

    // 1. валидация формы
    let error = formValidate(form); // ! валидировать все необходимые инпуты на форме

    // 2. сбор данных с формы + прикрепление изображения
    let formData = new FormData(form);
    formData.append('image', formImage.files[0]);

    if (error === 0) {
      // т.к. отправка данных может затянуться, нужно уведомить пользователя о процессе
      form.classList.add('_sending');

      // отправка методом AJAX 
      let response = await fetch('sendmail.php', {
        method: 'POST',
        body: formData
      });

      // если JSON-ответ удачный, то выводим этот ответ и очищаем превью и поля
      if (response.ok) {
        let result = await response.json();
        alert(result.message);
        formPreview.innerHTML = '';
        form.reset(); 
        form.classList.remove('_sending');
      } else {
        alert('Ошибка отправки данных');
        form.classList.remove('_sending');
      }
    } else {
      // alert('Заполните обязательные поля'); // ! можно выводить модальное окно диалога
    }
  }

  // ? валидация полей ввода в форме
  // ? асинхронность НЕ НУЖНА, как в отправке данных, т.к. все проверки проводятся локально на клиенте
  function formValidate(form) {
    let error = 0;
    // навесим класс _req на поля, подлежащие проверке
    let formReq = document.querySelectorAll('._req');

    for (let index = 0; index < formReq.length; index++) {
      const input = formReq[index];
      formRemoveError(input); // ! убрать класс error перед проверкой на ошибки

      // навесим класс _email на поля с электронной почтой
      if (input.classList.contains('_email')) {
        if (!validateEmail(input)) {
          formAddError(input);
          error++;
        }
      } else 
      // проверяем чекбокс на включенность
      if (input.getAttribute('type') === 'checkbox' && input.checked === false) {
        formAddError(input);
        error++;
      } else 
      // проверка текстового поля на заполненность
      {
        if (String(input.value).trim() === '') {
          formAddError(input);
          error++;
        }
      }
    }

    return error;
  }

  // ? навесить/снять класс ошибки валидации
  function formAddError(input) {
    input.parentElement.classList.add('_error');
    input.classList.add('_error');
  }
  function formRemoveError(input) {
    input.parentElement.classList.remove('_error');
    input.classList.remove('_error');
  }
  // ? валидация email
  function validateEmail(input) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/.test(input.value);
  }
  
  // ? подготовка превью фото
  function uploadFile(file) {
    // проверка на тип загружаемого файла
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      alert('Разрешены только изображения');
      return;
    }
    // проверка на размер загружаемого файла
    if (file.size > 2*1024*1024) {
      alert('Файл не должен превышать 2 Мб');
      return;
    }

    // загрузить уменьшенное изображение в превью
    var reader = new FileReader();
    reader.onload = function (e) {
      formPreview.innerHTML = `<img src="${e.target.result}" alt="Фото">`; // ! обратные кавычки для обработки кода внутри
    };
    reader.onerror = function (e) {
      alert('Ошибка');
    }
    reader.readAsDataURL(file);
  }
})

