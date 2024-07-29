dotenv = require('dotenv');
dotenv.config();
express = require('express');
path = require('path');
cookieParser = require('cookie-parser');
//logger = require('morgan');
mongoose = require("mongoose");
cors = require('cors');
//fetch = require('node-fetch');
_ = require("lodash");
cron = require('node-cron');
nodemailer = require('nodemailer');
try {
//crypto = require('node:crypto');
const {
  scrypt,
  randomFill,
  //createCipheriv,
  //createDecipheriv,
} = require('node:crypto');

console.log("Found crypto");
}
catch (e) {
console.log(e);	
}

//Razorpay = require("razorpay");
//docx = require("docx");
fs = require('fs');
axios = require('axios');
pin = require('pincode');

const { 
	memberGetAll,
} = require('./routes/dbfunctions'); 

// mongoose settings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);


//multer = require('multer');
readXlsxFile = require('read-excel-file');


app = express();

console.log(process.env.PRODUCTION);
PRODUCTION=(process.env.PRODUCTION.toUpperCase() === "TRUE");   
WEB=(process.env.WEB.toUpperCase() === "TRUE");   
console.log("Prod", PRODUCTION);
console.log("Web", WEB);

//PASSWORDLINKVALIDTIME=10			// Password link valid time in minutes


//
BASELINK='http://localhost:3000';
if (PRODUCTION) {
	//console.log("Using cloud  base  link");
  BASELINK='https://pdhsamaj.herokuapp.com';
} else {
	//console.log("Using local base  link");
}
console.log(BASELINK);
ARCHIVEDIR= (PRODUCTION) ? "public/" : "public/" ;       // binary will be stored here

PORT = process.env.PORT || 4000;
//VISITTYPE = {pending: 'pending', cancelled: 'cancelled', over: 'over', expired: 'expired'};


http = require('http');
httpServer = http.createServer(app);
io = require('socket.io')(httpServer, {
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
      "Access-Control-Allow-Credentials": true
    };
    res.writeHead(200, headers);
    res.end();
  }

});

// Routers
router = express.Router();
indexRouter = require('./routes/index');
usersRouter = require('./routes/user');
memberRouter = require('./routes/member');
hodRouter = require('./routes/hod');
importRouter = require('./routes/import');
humadRouter = require('./routes/humad');
pjymRouter = require('./routes/pjym');
gotraRouter = require('./routes/gotra');
cityRouter = require('./routes/city');
adminRouter = require('./routes/admin');
applicationRouter = require('./routes/application');

app.set('view engine', 'html');
//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'PDHS', 'build')));
app.use(express.json());


app.use((req, res, next) => {
  if (req.url.includes("admin") || 
      req.url.includes("signIn") ||
      req.url.includes("Logout") ||
      req.url.includes("pdhsamaj")
    ){
    //req.url = "/";
    //res.redirect('/');
    console.log("Path is ", req.url);
    res.sendFile(path.resolve(__dirname, 'PDHS', 'build', 'index.html'));
  }
  else {
    next();
  }
});

app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/member', memberRouter);
app.use('/hod', hodRouter);
app.use('/import', importRouter);
app.use('/humad', humadRouter);
app.use('/pjym', pjymRouter);
app.use('/gotra', gotraRouter);
app.use('/city', cityRouter);
app.use('/pdhsadm', adminRouter);
app.use('/apply', applicationRouter);

//Schema

PasswordSchema = mongoose.Schema({
	mobile: String,
	captcha: String
}, {timestamps: true});
PasswordSchema.index({createdAt: 1},{expireAfterSeconds: 300});
PasswordSchema.index({mobile: 1});


UserSchema = mongoose.Schema({
  uid: Number,
  userName: String,
  displayName: String,
  password: String,
  status: Boolean,
  email: String,
  userType: String,
  mobile: String,
	cid: String,
});

//--- Medicine structure


adminSchema = mongoose.Schema({
	//id: Number,
	//hid: Number,
	mid: Number,
	superAdmin: Boolean,
	humadAdmin: Boolean,
	pjymAdmin: Boolean,
	prwsAdmin: Boolean,			//Welfare samiti
	pmmAdmin: Boolean,
	superduper: Boolean			// Atul & Arun are super duper. They cannot be deleted
});

GotraSchema = mongoose.Schema({
	id: String,
	gotra: String,
	enabled: Boolean
});

CitySchema = mongoose.Schema({
	id: String,
	city: String,
	enabled: Boolean
});

HodSchema = mongoose.Schema({
	hid: Number,
	mid: Number,		// not required. Order 0 (zero) in Member list are HOD 
	gotra: String,
	caste: String,
	subCaste: String,
	village: String,
	resAddr: String,
	resAddr1: String,
	resAddr2: String,
	resAddr3: String,
	resAddr4: String,
	resAddr5: String,
	resAddr6: String,
	suburb: String,
	city: String,
	pinCode: Number,
	division: String,
	district: String,
	state: String,
	resPhone1: String,
	resPhone2: String,
	active:  Boolean
});
HodSchema.index({hid: 1});


HodApplSchema = mongoose.Schema({
	applicationNumber: Number,	
	applicationDate: Date,
	applicationType: String,
	applicationOwner: String,
	applicationStatus: String,
	newHod: Number,
	newGotra: String,
	newCaste: String,
	newSubCaste: String,
	hid: Number		// 0  for new directory application
});

MemberApplSchema = mongoose.Schema({
	applicationNumber: Number,	
	applicationDate: Date,
	applicationType: String,
	applicationOwner: String,
	applicationStatus: String,
	newHod: Number,
	newGotra: String,
	newCaste: String,
	newSubCaste: String,
	hid: Number,					// 0  for new directory application
	newhumadMid: [Number],
	
});

MemberSchema = mongoose.Schema({
	hid: Number,
	order: Number,
	mid: Number,
	spouseMid: Number,
	dateOfMarriage: Date,
	title: String,
	lastName: String,
	firstName: String,
	middleName: String,
	alias: String,
	relation: String,
	gender: String,
	dob: Date,
	bloodGroup: String,
	emsStatus: String,
	education: String,
	educationLevel: String,
	educationCategory: String,
	educationField: String,
	occupation: String,
	mobile: String,
	email: String,
	officeName: String,
	officeAddr: String,
	officePhone: String,
	mobile1: String,
	email1: String,
	ceased: Boolean,
	ceasedDate: Date,
	pjymMember: Boolean,
	humadMember: Boolean,
	prwsMember: Boolean,
	pmmMember: Boolean,
	lockInfo: {isLocked: Boolean, lockedBy: String, applicationId: String, remarks: String}
})
MemberSchema.index({mid: 1});
MemberSchema.index({ceased: 1});
MemberSchema.index({pjymMember: 1});
MemberSchema.index({humadMember: 1});
MemberSchema.index({prwsMember: 1});


PjymSchema = mongoose.Schema({
	hid: Number,
	mid: Number,
	membershipNumber: String,
	membershipDate: Date,
	membershipReceipt: String,
	upgradeIndex: Number,
	active: Boolean
});
PjymSchema.index({mid: 1});
PjymSchema.index({active: 1});

HumadSchema = mongoose.Schema({
	hid: Number,
	mid: Number,
	membershipNumber: String,
	membershipDate: Date,
	membershipReceipt: String,
	remarks: String,
	upgradeIndex: Number,
	active: Boolean
});
HumadSchema.index({mid: 1});
HumadSchema.index({active: 1});

PrwsLogSchema = mongoose.Schema({
	date: 		Date,
	mid:  		Number,			// MID of member who has has taken action (-1 if not a member
	name: 		String,			// Name of the member
	isAdmin:	String,			// Apply or Approved or Reject
	desc:			String,
	action:		String,
	data:			String,
	status: 	Boolean
	
});


PinCodeSchema = mongoose.Schema({
	pinCode: Number,
	district: String,
	state: String,
	division: String,
	found: Boolean
});

ApplicationSchema = mongoose.Schema({
	id: Number,
	date: Date,
	owner: String,
	desc: String,
	hid: Number,
	hodMid: Number,
	hodName: String,
	mid: Number,
	name: String,
	isMember: Boolean,
	data: String,
	//type: String,
	status: String,
	aminMid: Number,
	adminName: String,
	comments: String,
	lockInfo: {isLocked: Boolean, lockedBy: String, applicationId: String, remarks: String}
});

// models
User = mongoose.model("user", UserSchema);
M_Admin = mongoose.model('admin', adminSchema);
M_Hod = mongoose.model('hod', HodSchema);
M_Member = mongoose.model('member', MemberSchema);
M_Humad = mongoose.model('humad', HumadSchema);
M_Pjym = mongoose.model('pjym', PjymSchema);
M_Gotra = mongoose.model('gotra', GotraSchema);
M_City  = mongoose.model('city', CitySchema);
M_Password = mongoose.model('password', PasswordSchema);
M_PinCode = mongoose.model('pincode', PinCodeSchema);
M_Application = mongoose.model('application', ApplicationSchema);
M_PrwsLog = mongoose.model('prwslog', PrwsLogSchema);

router = express.Router();

db_connection = false;      // status of mongoose connection
connectRequest = true;

// constant used by routers
minutesIST = 330;    // IST time zone in minutes 330 i.e. GMT+5:30
minutesDay = 1440;   // minutes in a day 24*60 = 1440
MONTHNAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
weekDays = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
weekShortDays = new Array("Sun", "Mon", "Tue", "Wedn", "Thu", "Fri", "Sat");


SENDRES = 1;        // send OK response
SENDSOCKET = 2;     // send data on socket

// Error messages
DBERROR = 990;
DBFETCHERR = 991;
CRICFETCHERR = 992;
ERR_NODB = "No connection to PDHS database";

allUSER = 99999999;
serverTimer = 0;
CUSTMF=100000000;
// make mongoose connection

// Create the database connection 
if (WEB) {
	mongoose.connect(process.env.MONGOCONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
} else {
	db_connection = true;
  connectRequest = true;
}
// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
  //console.log('Mongoose default connection open to ' + process.env.MONGOCONNECTION);
	console.log('Database connection success');
  db_connection = true;
  connectRequest = true;
	memberGetAll();

});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
  console.log('Database default connection error');
  //console.log(error);
  db_connection = false;
  connectRequest = false;   // connect request refused
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
  db_connection = false;
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function () {
  // close mongoose connection
  mongoose.connection.close(function () {
    console.log('Database default connection disconnected through app termination');
  });
  process.exit(0);
});

// schedule task
if (WEB) {
  cron.schedule('*/15 * * * * *', () => {
    // console.log('running every 15 second');
    // console.log(`db_connection: ${db_connection}    connectREquest: ${connectRequest}`);
    if (!connectRequest)
      mongoose.connect(process.env.MONGOCONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
  });
}


// start app to listen on specified port
httpServer.listen(PORT, () => {
  console.log("Server is running on Port: " + PORT);
});


// global functions

const AMPM = [
  "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM", "AM",
  "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM", "PM"
];
  /**
 * @param {Date} d The date
 */
const TZ_IST={hours: 5, minutes: 30};
cricDate = function (d)  {
  var xxx = new Date(d.getTime());
  xxx.setHours(xxx.getHours()+TZ_IST.hours);
  xxx.setMinutes(xxx.getMinutes()+TZ_IST.minutes);
  var myHour = xxx.getHours();
  var myampm = AMPM[myHour];
  if (myHour > 12) myHour -= 12;
  var tmp = `${MONTHNAME[xxx.getMonth()]} ${("0" + xxx.getDate()).slice(-2)} ${("0" + myHour).slice(-2)}:${("0" +  xxx.getMinutes()).slice(-2)}${myampm}`
  return tmp;
}


EMAILERROR="";
APLEMAILID='cricketpwd@gmail.com';

WEEKSTR = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];SHORTWEEKSTR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
MONTHSTR = ["January", "February", "March", "April", "May", "June",
						"July", "August", "September", "October", "November", "December"];	
						
SHORTMONTHSTR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oc", "Nov", "Dec"];	

HOURSTR = [
"00", 
"01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
"11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
"21", "22", "23"
];

MINUTESTR = [
"00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
"10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
"20", "21", "22", "23", "24", "25", "26", "27", "28", "29", 
"30", "31", "32", "33", "34", "35", "36", "37", "38", "39", 
"40", "41", "42", "43", "44", "45", "46", "47", "48", "49", 
"50", "51", "52", "53", "54", "55", "56", "57", "58", "59"
];

MINUTEBLOCK=[0, 15, 30, 45];

DATESTR = [
"00",
"01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
"11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
"21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
"31"							
];

//in date function 0 represents JAN I.e. month number 1
MONTHNUMBERSTR = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

HOURSTR = [
"00", 
"01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
"11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
"21", "22", "23"
];

MINUTESTR = [
"00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
"10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
"20", "21", "22", "23", "24", "25", "26", "27", "28", "29", 
"30", "31", "32", "33", "34", "35", "36", "37", "38", "39", 
"40", "41", "42", "43", "44", "45", "46", "47", "48", "49", 
"50", "51", "52", "53", "54", "55", "56", "57", "58", "59"
];

MUMBAIREGION = [{city: /^mum/i }, {city: /^than/i }, {city: /^bhayan/i }, {city: /^virar/i }, {city: /^palgh/i } ];

// module.exports = app;
ALLDOCTORS = 0xFFFFFFFF;

MAGICNUMBER = 99999;

FAMILYMF = 1000;




APPLICATIONTYPES = {
	editGotra:  			"Edit Gotra",
	addMember: 				"Add Member",
	editMember: 			"Edit Member",
	memberCeased: 		"Member Ceased",
	spouseDetails: 		"Spouse Details",
	newHod: 					"New F.Head",
	transferMember:		"Move members",
};

APPLICATIONSTATUS = {
	approved:  	"Approved",
	rejected: 	"Rejected",
	pending: 		"Pending"
};

PRWSACTION = {
	login:  				"Login",
	logout: 				"Logout",
	memberCeased: 	"Member Ceased",
};

PRWSMAILHEADER = {
	login:  	'PRWS login OTP',
	logout: 	"PRWS logout",
};

OWNER = {
	prws:   "PRWS",
	pjym:		"PJYM",
	humad:	"Humad",
	pmm:		"PMM"
};


ELIGIBLEMARRIAGEYEARS = 21;