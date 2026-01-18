$(function () {
  'use strict';
  // Take all the forms we want to apply Bootstrap custom validation styles to
  const forms = $('.needs-validation');
  // Loop through forms and prevent submission
  forms.on('submit', function (event) {
    const form = $(this);

    var actionInput = $(this).find("input[name='action']");

    if (!form[0].checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
      $('.submit_form').html('Sending...');
      $('.submit_subscribe').html('Sending...');
      const toast = new bootstrap.Toast($('.success_msg')[0]);
      const errtoast = new bootstrap.Toast($('.error_msg')[0]);
      var formData = form.serialize();
      $.ajax({
        type: "POST",
        url: "php/form_process.php",
        data: formData,
        success: function (response) {
          if (response === 'success') {
            if (actionInput.length > 0) {
              if (actionInput.val() === 'subscribe') {
                $('.submit_subscribe').html('Subscribe');
                const toast_comment = new bootstrap.Toast($('.success_msg_subscribe')[0]);
                toast_comment.show();
              }
            } else {
              toast.show()
              $('.submit_form').html('Send Message');
            }
          } else {
            // errtoast.show()
            console.log('errorrrrrr')
            $('.submit_form').html('Send Message');
            $('.submit_subscribe').html('Subscribe');
          }
        }
      });
    }

    form.addClass('was-validated');
  });
});