otpGenerator = require('otp-generator')
router = express.Router();
const { encrypt, decrypt, dbencrypt, dbdecrypt, dbToSvrText, 
  akshuGetGroup, akshuUpdGroup, akshuGetGroupMembers,
  akshuGetAuction, akshuGetTournament,
  getTournamentType,
  svrToDbText, getLoginName, getDisplayName, getMemberName, 
	sendCricMail, sendCricHtmlMail,
  akshuGetUser, akshuUpdUser,
  getMaster, setMaster,
} = require('./functions'); 

const {
	memberGetAll, memberGetHodMembers,
	memberAddOne, memberAddMany,
	memberUpdateOne, memberUpdateMany,
	memberGetByMidOne, memberGetByMidMany, memberGetByMobileOne, memberGetByEmailOne,
	
} = require('./dbfunctions');

const SENDCAPTAOVEREMAIL = false;

//const is_Captain = true;
//const is_ViceCaptain = false;
//const WITH_CVC  = 1;
//const WITHOUT_CVC = 2;

var _group;
 

/* GET all users listing. */
router.get('/', function (req, res, next) {
  // CricRes = res;
  setHeader(res);
  if (!db_connection) { senderr(res, DBERROR, ERR_NODB); return; }
  if (req.url == "/")
    publish_users(res, {});
  else
    next('route');
});


router.get('/svrtoclient/:text', async function (req, res, next) {
  // CricRes = res;
  setHeader(res);
  var { text } = req.params;
	//let x = dbdecrypt(text);
	//console.log()
  sendok(res, svrToDbText(text));
});


router.get('/encrypt/:text', function (req, res, next) {
  // CricRes = res;
  setHeader(res);
  let { text } = req.params;
  const hash = encrypt(text);
  console.log(hash);
  sendok(res, hash);

});

router.get('/decrypt/:text', function (req, res, next) {
  // CricRes = res;
  setHeader(res);
  let { text } = req.params;
  const hash = decrypt(text);
  console.log(hash);
  sendok(res, hash);

});

router.get('/dbencrypt/:text', function (req, res, next) {
  // CricRes = res;
  setHeader(res);
  let { text } = req.params;
  const hash = dbencrypt(text);
  console.log(hash);
  sendok(res, hash);

});

router.get('/dbdecrypt/:text', function (req, res, next) {
  // CricRes = res;
  setHeader(res);
  let { text } = req.params;
  const hash = dbdecrypt(text);
  console.log(hash);
  sendok(res, hash);

});



//=============== LOGIN
const validNumbers = [
	{name: '8080820084', uid: 1, type: 'Admin'},
	{name: '9920301805', uid: 2, type: 'User'},
	{name: '9867100677', uid: 3, type: 'Admin'},
	{name: '9867061850', uid: 4, type: 'Guest'}
	];
	
	
router.get('/jaijinendra/:myData', async function (req, res, next) {
  setHeader(res);
  var {myData } = req.params;
  var isValid = false;
  
	var myData = JSON.parse(myData);
	var userName = decrypt(myData.userName);
	console.log(userName);
	
	var myRec;
	var myEmail = "";
	var myMobile = "";
	if (myData.isMobile) {
		myRec = await memberGetByMobileOne( userName )
		if (myRec) myEmail = dbdecrypt(myRec.email);
		myMobile = userName;
	} 
	else {
		myRec = await memberGetByEmailOne ( userName );
		myEmail = userName;
		if (myRec) myMobile = (myRec.mobile.length === 10) ? myRec.mobile : "";
	}
	console.log(myEmail, myMobile);
	
  let myCaptha = await M_Password.findOne({mobile: userName});
  if (!myCaptha) {
    myCaptha = new M_Password();
    myCaptha.mobile = userName;
    myCaptha.captcha = otpGenerator.generate(8, { specialChars: false, lowerCaseAlphabets: false, upperCaseAlphabets: false });
	  console.log(`New captha ${myCaptha.captcha}`);
	  myCaptha.save();
  }

	var emailMsg = "";
	var mobMsg = "";
	if (myEmail !== "") {
		var tmpValidTimeOffset = Number(process.env.PASSWORDLINKVALIDTIME);
		let htmlText = `<div style="background-image: url('https://i.pinimg.com/originals/29/9c/a1/299ca187762b51cb637f29cf7472e574.png');">
			<h4 style="text-align: left;">&nbsp;</h4>
			<h4 style="text-align: left;"><strong>Dear Member,</strong></h4>
			<p>Greetings from Pratapgarh Rajasthan Welfare Samiti</p>
			<p>Login with Captha ${myCaptha.captcha} &nbsp;</p>
			<p>Kindly note that this captcha is valid only for ${process.env.PASSWORDLINKVALIDTIME} minutes.</p>
			<p>&nbsp;</p>
			<p><span style="text-align: left;"><strong>Regards,</strong></span><br /><span style="text-align: left;"><strong>for Pratapgarh Rajasthan Welfare Samiti</strong></span></p>
			</div>`
		
		if (SENDCAPTAOVEREMAIL) {
			let resp = await sendCricHtmlMail(myEmail, PRWSMAILHEADER.login, htmlText);
		}
		
		var tmp = myEmail.split("@");
		console.log(tmp[0]);
		var emailMsg = ((tmp[0].length > 4) ? ("******" + tmp[0].substring(tmp[0].length - 4)) : "****" ) + "@" + tmp[1];
	}
	
	if (myMobile) {
		// Send OPT over email
		var mobMsg = "******" + myMobile.substring(6);
	}
	console.log(emailMsg, mobMsg);
	var tmp = "OTP sent over " + mobMsg + (((mobMsg !== "") && (emailMsg !== "")) ? " and " : "") + emailMsg;
	
  sendok(res, {captcha: myCaptha.captcha, msg: tmp });
	

});

var directLogin = ['8080820084', '9867100677', '9867061850', '9819804128', '1234567890'];

router.get('/orgpadmavatimata/:uMobile/:uPassword', async function (req, res, next) {
  setHeader(res);
  var {uMobile, uPassword } = req.params;
  //uMobile = Number(uMobile);

	if (!directLogin.includes(uMobile)) {
		// verify captcha
		console.log(uMobile, uPassword);
		let myCaptha = await M_Password.findOne({mobile: uMobile});
		if (!myCaptha) return senderr(res, 601, "Invalid password");
		console.log(myCaptha);
		if (myCaptha.captcha !== uPassword) return senderr(res, 601, "Invalid password");
	}
 
	let myAdmin = {
		mid: 0, 
		superAdmin: false, humadAdmin: false, 
		pjymAdmin: false, prwsAdmin: false, 
		pmmAdmin: false
	};
	var isMember = false;
	var isAdmin = false;
  //let myMem = await M_Member.findOne({$or :[{mobile: uMobile}, {mobile1: uMobile}] });
	let myMem = await memberGetByMobileOne(uMobile);
	
  if (myMem) {
		isMember = true;
		myAdmin = await M_Admin.findOne({mid: myMem.mid});
		if (!myAdmin) {
			myAdmin = {
				mid: myMem.mid, 
				superAdmin: false, humadAdmin: false, 
				pjymAdmin: false, prwsAdmin: false, 
				pmmAdmin: false
			};
		}
		else {
			isAdmin = true;
		}
	}
	//console.log(myAdmin);

  sendok(res, {user: myMem, admin: myAdmin, isMember: isMember});

	// Make logger entry of use login.
	let myLogRec = new M_PrwsLog();
	myLogRec.date = new Date();
	if (myMem) {
		myLogRec.mid = myMem.mid;
		myLogRec.name = getMemberName(myMem);
		myLogRec.desc = `Login by ${getMemberName(myMem)}`;
	}
	else {
		myLogRec.mid = 0;
		myLogRec.name = `Guest with mobile number ${uMobile}`;
		myLogRec.desc = `Login by ${uMobile}`;
	}
	myLogRec.isAdmin = isAdmin;
	myLogRec.action = PRWSACTION.login;
	myLogRec.data = '';
	myLogRec.status = true;
	await myLogRec.save();
	
});

router.get('/padmavatimata/:myData', async function (req, res, next) {
  setHeader(res);
	var {myData } = req.params;
  var isValid = false;
  
	var myData = JSON.parse(myData);
	var userName = decrypt(myData.userName);
	console.log(userName);
	

	if (!directLogin.includes(userName)) {
		// verify captcha
		//console.log(uMobile, uPassword);
		let myCaptha = await M_Password.findOne({mobile: userName});
		if (!myCaptha) return senderr(res, 601, "Invalid password");
		console.log(myCaptha);
		if (myCaptha.captcha !== myData.password) return senderr(res, 601, "Invalid password");
	}
 
	let myAdmin = {
		mid: 0, 
		superAdmin: false, humadAdmin: false, 
		pjymAdmin: false, prwsAdmin: false, 
		pmmAdmin: false
	};
	var isMember = false;
	var isAdmin = false;
  //let myMem = await M_Member.findOne({$or :[{mobile: uMobile}, {mobile1: uMobile}] });
	let myMem = (myData.isMobile) ?
		await memberGetByMobileOne(userName) :
		await memberGetByEmailOne(userName);
	
  if (myMem) {
		isMember = true;
		myAdmin = await M_Admin.findOne({mid: myMem.mid});
		if (!myAdmin) {
			myAdmin = {
				mid: myMem.mid, 
				superAdmin: false, humadAdmin: false, 
				pjymAdmin: false, prwsAdmin: false, 
				pmmAdmin: false
			};
		}
		else {
			isAdmin = true;
		}
	}
	//console.log(myAdmin);

  sendok(res, {user: myMem, admin: myAdmin, isMember: isMember, userName: userName});

	// Make logger entry of use login.
	let myLogRec = new M_PrwsLog();
	myLogRec.date = new Date();
	if (myMem) {
		myLogRec.mid = myMem.mid;
		myLogRec.name = getMemberName(myMem);
		myLogRec.desc = `Login by ${getMemberName(myMem)}`;
	}
	else {
		myLogRec.mid = 0;
		myLogRec.name = `Guest ( ${userName} )`;
		myLogRec.desc = `Login by Guest ( ${userName} )`;
	}
	myLogRec.isAdmin = isAdmin;
	myLogRec.action = PRWSACTION.login;
	myLogRec.data = '';
	myLogRec.status = true;
	await myLogRec.save();
	
});

router.get('/logout/:myData', async function (req, res, next) {
  setHeader(res);
  var { myData } = req.params;
	console.log(myData);
	
	sendok(res, "Done");			// First confirm to client for logout
	
	myData = JSON.parse(myData);
	// Make logger entry of use login.
	let myLogRec = new M_PrwsLog();
	myLogRec.date = new Date();
	if (myData.mid > 0) {
		myLogRec.mid = myData.mid;
		myLogRec.name = myData.name;
		myLogRec.desc = `Logout by ${myData.name}`;
	}
	else {
		myLogRec.mid = 0;
		myLogRec.name = myData.name;
		myLogRec.desc = `Logout by ${myData.name}`;
	}
	myLogRec.isAdmin = myData.isAdmin;
	myLogRec.action = PRWSACTION.logout;
	myLogRec.data = '';
	myLogRec.status = true;
	await myLogRec.save();
	//console.log(myLogRec);
});



router.get('/padmavatimataexcel/:uMobile/:uPassword', async function (req, res, next) {
  setHeader(res);
  var {uMobile, uPassword } = req.params;
  uMobile = Number(uMobile);
  //uPassword = decrypt(uPassword);

  let myCaptha = await M_Password.findOne({mobile: uMobile});
  if (!myCaptha) return senderr(res, 601, "Invalid password");
  if (myCaptha.captcha !== uPassword) return senderr(res, 601, "Invalid password");

	let  myAdmin = {superAdmin: false, humadAdmin: false, pjymAdmin: false, prwsAdmin: false};
  if (uMobile == 8080820084) myAdmin.superAdmin = true;

	console.log(myAdmin);
  sendok(res, myAdmin);

});






async function publish_users(res, filter_users) {
  //console.log(filter_users);
  var ulist = await User.find(filter_users);
  // ulist = _.map(ulist, o => _.pick(o, ['uid', 'userName', 'displayName', 'defaultGroup']));
  ulist = _.sortBy(ulist, 'userName');
  sendok(res, ulist);
}


function sendok(res, usrmgs) { res.send(usrmgs); }
function senderr(res, errcode, errmsg) { res.status(errcode).send({error: errmsg}); }
function setHeader(res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
}
module.exports = router;
