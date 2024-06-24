const deleteButtons = document.querySelectorAll('.admin_delete_button');

function askForConfirmation(e) {
  const confirmation = confirm('Please confirm deletion');

  if (!confirmation) e.preventDefault();
}

deleteButtons.forEach((button) => {
  button.addEventListener('click', askForConfirmation);
});
