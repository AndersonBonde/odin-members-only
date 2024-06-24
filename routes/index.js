require('dotenv').config();

const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Message = require('../models/message');
const { body, validationResult } = require('express-validator'); 
const { generatePassword, validatePassword } = require('../lib/passwordUtils');

/* GET home page. */
router.get('/', async function(req, res, next) {
  const messages = await Message.find({}).sort({ timestamp: 1 }).populate('author').exec();

  const data = { 
    messages,
    title: 'Message Board',
  };
  
  if (req.isAuthenticated()) {
    data['user'] = req.user;
  }

  res.render('index', { data });
});

// Handle signup GET.
router.get('/signup', function(req, res, next) {
  const data = { title: 'Sign Up' };

  res.render('signup_form', { data });
});

// Handle signup POST.
router.post('/signup', [
  // Validate and sanitize fields.
  body('firstname', 'First name must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('lastname', 'Last name must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('email')
    .trim()
    .custom(async (value) => {
      const user = await User.findOne({ email: value }).exec();
      
      if (user) {
        throw new Error('Email already in use');
      }
    })
    .escape(),
  body('password', 'Password length must be 6 or higher')
    .trim()
    .isLength({ min: 6 })
    .escape(),
  body('password_confirm', 'The password and confirm password values did not match')
    .trim()
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    const errors = validationResult(req);
    const { hash, salt } = generatePassword(req.body.password);
    
    const user = new User({
      hash,
      salt,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      membership: 'guest',
    });

    if (!errors.isEmpty()) {
      // There are errors. Render page again with sanitized values.

      const data = {
        user,
        title: 'Sign Up',
        errors: errors.array(),
      };
      res.render('signup_form', { data });
    } else {
      // Data from form is valid. Save user.
      await user.save();
      // TODO: After signup redirect to message board with user already logged in.
      res.redirect('/');
    }
  }
]);

// Handle login GET;
router.get('/login', function(req, res, next) {
  const data = { title: 'Login' };

  res.render('login_form', { data });
});

// Handle login POST;
router.post('/login', 
  passport.authenticate('local', { 
    failureRedirect: '/login_failure', 
    failureMessage: true, 
    successRedirect: '/login_success' 
  })
);

// Handle login success GET;
router.get('/login_success', (req, res, next) => {
  res.redirect('/');
});

// Handle redirect from login to login_failure by displaying error reason.
router.get('/login_failure', (req, res, next) => {
  const data = { 
    title: 'Login',
    failureMessage: 'Email or password is incorrect',
  };

  res.render('login_form', { data });
});

// Handle logout GET;
router.get('/logout', (req, res, next) => {
  req.logout((err) => { if (err) next(err) });
  res.redirect('/');
})

// Handle new message GET;
router.get('/new_message', (req, res, next) => {
  if (!req.isAuthenticated()) res.redirect('/');

  const data = { title: 'New Message' };

  res.render('new_message_form', { data });
});

// Handle new message POST;
router.post('/new_message', [
  // Validate and sanitize fields.
  body('title', 'Please add a title to your message')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('message', 'Your message must contain at least 1 character')
    .trim()
    .isLength({ min: 1 })
    .escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    const errors = validationResult(req);
    const user = await User.findOne({ _id: req.session.passport.user }).exec();

    const message = new Message({
      title: req.body.title,
      text: req.body.message,
      timestamp: new Date(),
      author: user,
    });

    if (!user) {
      throw new Error('You must be signed in to post a message');
    }
    
    if (!errors.isEmpty()) {
      // Invalid message. Reload the form with sanitized values.
      const data = { 
        message,
        title: 'New Message',
        errors: errors.array(),
      };

      res.render('new_message_form', { data });
    } else {
      // Fields are valid. Save message.
      await message.save();
      res.redirect('/');
    }
  }
]);

// Handle join_membership GET;
router.get('/join_membership', (req, res, next) => {
  if (!req.isAuthenticated()) res.redirect('/');

  const data = { title: 'Enter secret password' };

  res.render('join_membership_form', { data });
});

router.post('/join_membership', async (req, res, next) => {
  if (req.body.password == process.env.SECRET_MEMBER_PASSWORD) {
    // Password is correct. Update user to member.
    const user = await User.findOne({ _id: req.session.passport.user }).exec();
    const newUser = Object.assign(user, { membership: 'member' });

    await User.findByIdAndUpdate(req.session.passport.user, newUser, {});

    res.redirect('/');
  } else {
    // Wrong password. Reload form with error message.

    const data = ({
      title: 'Enter secret password',
      error: 'Secret password is incorrect',
    });

    res.render('join_membership_form', { data });
  }
});

// Handle admin GET.
router.get('/admin', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/');
  }

  const data = { title: 'Enter admin password' };

  res.render('join_admin_form', { data });
});

// Handle admin POST.
router.post('/admin', async(req, res, next) => {
  if (req.body.password == process.env.SECRET_ADMIN_PASSWORD) {
    // Password is correct. Update user to admin.
    const user = await User.findOne({ _id: req.session.passport.user }).exec();
    const newUser = Object.assign(user, { admin: true });

    await User.findByIdAndUpdate(req.session.passport.user, newUser, {});

    res.redirect('/');
  } else {
    // Wrong password. Reload form with error message.

    const data = ({
      title: 'Enter admin password',
      error: 'Admin password is incorrect',
    });

    res.render('join_admin_form', { data });
  }
});

// Handle delete_message POST.
router.post('/delete_message', async (req, res, next) => {
  const message = await Message.findById(req.body.messageid).exec();
  
  if (!message) {
    // Not found.
    res.redirect('/');
  } else {
    // Delete message and reload page.
    await Message.findByIdAndDelete(req.body.messageid);
    res.redirect('/');
  }
})

module.exports = router;
