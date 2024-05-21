export const welcomeProviderTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Welcome Email</title>
</head>
<body>
<p>Dear <strong>{{userFirstName}}</strong>,</p>

<p>Welcome to <strong>{{appName}}</strong>! We are excited to have you on board and look forward to helping you get the most out of our services.</p>

<p><strong>Your account has been successfully created</strong> and you can start using it immediately. Below are your login credentials and the URL where you can access your account:</p>

<ul>
<li><strong>Username:</strong> {{email}}</li>
<li><strong>Password:</strong> {{password}}</li>
<li><strong>Login URL:</strong> <a href="{{loginUrl}}" target="_blank">Click here to log in</a></li>
</ul>

<p>For security reasons, please ensure that you change your password upon your first login.</p>

<p>If you have any questions or need assistance getting started, our support team is here to help. You can reach us at <strong>{{supportEmail}}</strong> or simply reply to this email.</p>

<p>Thank you for choosing <strong>{{appName}}</strong>. We're thrilled to support you on your journey with us.</p>

<p>Warm regards,</p>

<p><strong>{{senderName}}<br>

</body>
</html>

`;
