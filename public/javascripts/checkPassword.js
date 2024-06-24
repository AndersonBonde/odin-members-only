const password = document.querySelector('#password');
const passwordConfirm = document.querySelector('#password_confirm');
const passwordMessage = document.querySelector('.password_message');

function displayPasswordMessage(text, color = 'black') {
  passwordMessage.innerText = text;
  passwordMessage.style.color = color;
  passwordMessage.style.marginLeft = '8px';
}

function removePasswordMessage() {
  passwordMessage.innerText = '';
}

function removeHighlight(e) {
  password.classList.remove('valid_password');
  passwordConfirm.classList.remove('valid_password');

  password.classList.remove('invalid_password');

  removePasswordMessage();
}

function highlightFieldWhenMatch(event) {
  if (password.value === passwordConfirm.value && password.value.length >= 6) {
    password.classList.add('valid_password');
    passwordConfirm.classList.add('valid_password');
    
    return true;
  } else {
    password.classList.remove('valid_password');
    passwordConfirm.classList.remove('valid_password');
  }
}

function checkMinimumLength(e) {
  if (password.value.length < 6) {
    password.classList.add('invalid_password');

    displayPasswordMessage('Minimum password length is 6', 'red');
  }
}

password.addEventListener('input', removeHighlight);
passwordConfirm.addEventListener('focus', checkMinimumLength);
passwordConfirm.addEventListener('input', highlightFieldWhenMatch);
