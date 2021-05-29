require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const hbs = require('hbs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');

require('./db/conn');
const Register = require('./models/registers');
const { json } = require('express');
const { log } = require('console');

const port = process.env.PORT || 4000;

const static_path = path.join(__dirname, '../public');
const template_path = path.join(__dirname, '../templates/views');
const partials_path = path.join(__dirname, '../templates/partials');

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));
app.set('view engine', 'hbs');
app.set('views', template_path);
hbs.registerPartials(partials_path);

app.get('/', (req, res) => {
	let jwToken = req.cookies.jwt;
	let isLogin = false;
	if (jwToken != null) {
		isLogin = true;
	}
	console.log(`this is our cookie${req.cookies.jwt}`);
	res.render('index', { isLogin });
});

app.get('/webpage', auth, (req, res) => {
	//console.log(`this is our cookie${req.cookies.jwt}`);
	res.render('webpage');
});

app.get('/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter(currElement => {
			return currElement.token !== req.token;
		});
		res.clearCookie('jwt');
		await req.user.save();
		res.render('login');
	} catch (error) {
		res.status(500).send(error);
	}
});

app.get('/register', (req, res) => {
	res.render('register');
});
app.get('/login', (req, res) => {
	res.render('login');
});
app.post('/register', async (req, res) => {
	try {
		const password = req.body.password;
		const cpassword = req.body.confirmpassword;

		if (password === cpassword) {
			const registerEmployee = new Register({
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				email: req.body.email,
				gender: req.body.gender,
				phone: req.body.phone,
				age: req.body.age,
				password: req.body.password,
				confirmpassword: req.body.confirmpassword,
			});

			const token = await registerEmployee.generateAuthToken();

			res.cookie('jwt', token, {
				expires: new Date(Date.now() + 600000),
			});

			const registered = await registerEmployee.save();

			res.status(201).render('index');
		} else {
			res.send('password are not matching');
		}
	} catch (error) {
		res.status(400).send(error);
	}
});
app.post('/login', async (req, res) => {
	try {
		const email = req.body.email;
		const password = req.body.password;
		const useremail = await Register.findOne({ email: email });

		const isMatch = await bcrypt.compare(password, useremail.password);

		const token = await useremail.generateAuthToken();
		res.cookie('jwt', token, {
			expires: new Date(Date.now() + 600000),
		});

		if (isMatch) {
			res.status(201).render('index');
		} else {
			res.send(error.message);
		}
	} catch (error) {
		res.status(400).send(error.message);
	}
});

app.listen(port, () => {
	console.log(`server iss running on port ${port}`);
});
