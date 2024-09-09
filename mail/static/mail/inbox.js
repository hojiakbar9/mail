document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send);

    load_mailbox('inbox');
});
;

function compose_email() {

  // Show compose view and hide other views
  closeView('emails');
  closeView('email');
  openView('compose');

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  localStorage.setItem('currentMailbox', mailbox);
  // Show the mailbox and hide other views
  openView('emails');
  closeView('compose'); 
  closeView('email');

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Load the mails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    //Show emails 
    emails.forEach(email => {
      let emailDiv = document.createElement('div');
      emailDiv.classList='list-group-item list-group-item-action';
      emailDiv.style.cursor = "pointer";
      emailDiv.style.background = email.read ? "#f5f5f5" : "";
      emailDiv.setAttribute('data-email-id', email.id);
      emailDiv.addEventListener('click', () => viewEmail(email.id, mailbox));

      let emailHeader = document.createElement('div');
      emailHeader.classList='d-flex w-100 justify-content-between'

      let emailSubject = document.createElement('p');
      emailSubject.classList='mb-1';
      emailSubject.innerHTML= `${email.subject}`;

      let emailSender = document.createElement('h5');
      emailSender.classList ='mb-1';
      emailSender.innerHTML=`${email.sender}`;

      let emailTimestamp= document.createElement('small');
      emailTimestamp.innerHTML = email.timestamp;

      emailHeader.appendChild(emailSender);
      emailHeader.appendChild(emailTimestamp);

      emailDiv.appendChild(emailHeader);
      emailDiv.appendChild(emailSubject);
    
      
      document.querySelector('#emails-view').appendChild(emailDiv);
    })
  });
}

function send(event) {
  event.preventDefault();

  // Get the input data
  var recipients = document.querySelector('#compose-recipients').value;
  var subject = document.querySelector('#compose-subject').value;
  var body = document.querySelector('#compose-body').value;

  // Make an API Request to send the email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  }).then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
      // Load the "sent" mailbox after sending the email
      load_mailbox('sent');
    });
  }

  function archiveEmail(email, id) {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: !email.archived
      })
    })
    .then(() => {
      $('#emailModal').modal('hide');
      location.reload(); // Reload the page after archiving
    });
  }
  
  function viewEmail(id, mailbox) {
    closeView('compose');
    openView('email');
  
    fetch(`/emails/${id}`)
      .then(response => response.json())
      .then(email => {
        let emailDiv = document.querySelector('.modal-body');
        document.getElementById('emailModalLabel').textContent = email.subject;
        emailDiv.innerHTML = `
          <p><strong>Sender:</strong> ${email.sender}</p>
          <p><strong>Receiver:</strong> ${email.recipients}</p>
          <p><strong>Timestamp:</strong> ${email.timestamp}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p>${email.body}</p>
        `;
  
        $('#emailModal').modal('show');
  
        // Mark as read if needed
        if (!email.read){
          markAsRead(email.id);
          let emailItem = document.querySelector(`div.list-group-item[data-email-id="${id}"]`);
          emailItem.style.background = "#f5f5f5";
        }

        // Archive/Unarchive/Reply
        const archiveButton = document.getElementById('archive');
        const replyButton = document.getElementById('reply');
        // Exclude sent mailbox from viewing the buttons
        if (mailbox==='sent'){ 
          archiveButton.style.display="none";
          replyButton.style.display="none";
        }
        else{
          archiveButton.style.display="block";
          replyButton.style.display="block";
        } 

        archiveButton.innerHTML = email.archived ? "Unarchive" : "Archive";
        archiveButton.classList = email.archived ? "btn btn-danger" : "btn btn-secondary";
        archiveButton.addEventListener('click', function() {
          archiveEmail(email, id); // Call the archiveEmail function
        });

        // Reply 
        replyButton.addEventListener('click', () => reply(email))
      });
  }
  
  
  function markAsRead(id){
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(
        {read : true}
      ),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('PUT request successful:', data);
      })
      .catch(error => {
        console.error('PUT request error:', error);
      });
    
    
  }
  function closeView(viewToClose) {
    if (viewToClose === 'compose') {
      // Hide the compose view
      document.querySelector('#compose-view').style.display = 'none';
    } else if (viewToClose === 'emails') {
      // Hide the emails view
      document.querySelector('#emails-view').style.display = 'none';
    } else if (viewToClose === 'email'){
      document.querySelector("#email-view").style.display = 'none';
    }
  }

  function openView(viewToOpen){
    if (viewToOpen === 'compose') {
      // Hide the compose view
      document.querySelector('#compose-view').style.display = 'block';
    } else if (viewToOpen === 'emails') {
      // Hide the emails view
      document.querySelector('#emails-view').style.display = 'block';
    } else if (viewToOpen === 'email'){
      document.querySelector("#email-view").style.display = 'block';
    }
  }
  
  function reply(email){
    closeView('emails');
    $('#emailModal').modal('hide');
    openView('compose');

    //Pre-fill recipient
    document.getElementById('compose-recipients').value = email.sender;

    //Pre-fill subject
    let subject = email.subject;
    document.getElementById('compose-subject').value = subject.startsWith("Re:") ? subject : `Re: ${subject}`;

    //Pre-fill body
    document.getElementById('compose-body').value =  `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  }
  
  