Accounts.config({
	sendVerificationEmail: Meteor.settings.server.email.forceValidation,
	forbidClientAccountCreation: true
	// set our default accounts config
});

Accounts.emailTemplates.siteName = Meteor.settings.server.email.siteName;
Accounts.emailTemplates.from = Meteor.settings.server.email.from;
// global email templates settings

Accounts.emailTemplates.verifyEmail.subject = function (user) {
    return 'Welcome to ' + Accounts.emailTemplates.siteName;
};

Accounts.emailTemplates.verifyEmail.text = function(user, url) {
	var split = url.split('/'),
		token = url[url.length - 1],
		url = Meteor.absoluteUrl('verify/' + token, {
			secure: Meteor.settings.server.secure
		});

	// grab the token from the url
	return "Hello " + user.profile.name + ", welcome to " + Accounts.emailTemplates.siteName + "\n\n" +
		   "To verify your account please visit the url below:\n\n" +
		   url + "\n\n"
		   "Thanks";
};
// setup our default email template

Meteor.methods({
	registerUser: function(name, nickname, email, password, confirmPassword) {

		var output = {failed: false, successMessage: '', errors: []},
			userId = null;

		name = Meteor.Helpers.trimInput(name);
		nickname = Meteor.Helpers.trimInput(nickname);
		email = Meteor.Helpers.trimInput(email);
		// trim inputs

		if (name == '' || nickname == '' || email == '' || password == '' || confirmPassword == '')
			output.errors.push({error: 'All fields are required'});
		// check if the fields have been entered (all are required)

		if (!Meteor.Helpers.isValidName(name))
			output.errors.push({error: 'The name you have entered is too long'});
		if (!Meteor.Helpers.isValidNickname(nickname))
			output.errors.push({error: 'The nickname you have entered is invalid'});
		if (!Meteor.Helpers.isValidEmail(email))
			output.errors.push({error: 'The email address you have entered is invalid'});
		if (!Meteor.Helpers.isValidPassword(password))
			output.errors.push({error: 'The password you have entered is invalid'});
		if (password != confirmPassword)
			output.errors.push({error: 'The passwords you have entered do not match'});
		// some more validation

		if (output.errors.length > 0) {
			output.failed = true;
			return output;
		}
		// seems we have some errors, lets just return them

		try {
			userId = Accounts.createUser({email: email, password: password, profile: {name: name, nickname: nickname}});
			// try and create the user
		} catch (e) {
			output.failed = true;
			output.errors.push({error: 'The email you have used is already in use'});
			// oh we've caught an error (probably email in use)

			return output;
		}

		if (!Meteor.settings.server.email.forceValidation) {
			output.successMessage = 'Your account has been successfully created, you may now login';
			return output;
		}
		// they don't need validated, lets just proceed by sending a message out

		try {
			Accounts.sendVerificationEmail(userId);
		} catch (e) {
			output.failed = true;
			output.errors.push({error: 'The validation email could not be sent, please contact the site administrator'});

			return output;
		}
		// seems they do need validated, attempt to send an email

		output.successMessage = 'Your account has been successfully created, you will get an email shortly';
		// all has went well

		return output;
	}
});