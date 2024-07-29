//const algorithm = 'aes-256-ctr';
const akshusecretKey = process.env.akshusecretKey;
const ankitsecretKey = process.env.ankitsecretKey;
const iv = process.env.iv; 
const algorithm = 'aes-256-ctr';          



//zTvzr3p67VC61jmV54rIYu1545x4TlY
let debugTest = true;
// for sending email
const send = require('gmail-send')();
var mailOptions =  {
  user: process.env.EMAILID,
  pass: process.env.EMAILPASSWORD,
  to:   '',
  subject: ''
  //html: ''
}


var arun_user={};
var arun_customer=[];
var arun_master=[];
const { createCipheriv, createDecipheriv }  = require('node:crypto');

const junkencrypt = (text) => {

    console.log(`Text is ${text}`);
	var encrypteddata = crypto.AES.encrypt(text, akshusecretKey).toString();
	console.log(encrypteddata);
	return encrypteddata;
	
    const cipher = crypto.createCipher(algorithm, akshusecretKey, Buffer.from(iv, 'hex'));	
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    //myIv = iv.toString('hex');

    return encrypted.toString('hex');
};

const encrypt = (text) => {

    console.log(`Text is ${text}`);
    const cipher = createCipheriv(algorithm, akshusecretKey, Buffer.from(iv, 'hex'));	
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    //myIv = iv.toString('hex');

    return encrypted.toString('hex');
};

const decrypt = (hash) => {

    const decipher = createDecipheriv(algorithm, akshusecretKey, Buffer.from(iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);
    return decrpyted.toString();
};

const dbencrypt = (text) => {

    //console.log(`Text is ${text}`);
    const cipher = crypto.createCipheriv(algorithm, ankitsecretKey, Buffer.from(iv, 'hex'));
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    //myIv = iv.toString('hex');

    return encrypted.toString('hex');
};

const dbdecrypt = (hash) => {

    const decipher = crypto.createDecipheriv(algorithm, ankitsecretKey, Buffer.from(iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);
    return decrpyted.toString();
};

const getLoginName = (name) => {
    return name.toLowerCase().replace(/\s/g, "");
  }
  
const getDisplayName = (name) => {
	  //console.log('xxx', name);
    var xxx = name.split(" ");
		for(let i=0; i<xxx.length; ++i) {
      let x = xxx[i].trim();
			let a = x.substr(0,1).toUpperCase();
			let b = x.substr(1, x.length).toLowerCase();
      xxx[i] = a + b;
			//console.log(a, b, a+b);
    };
		//console.log(xxx);
    return xxx.join(" ");
  }

const svrToDbText = (text) => {
	// first decrypt text sent by server
    let xxx = decrypt(text);
	// now encrypt this for database
	xxx = dbencrypt(xxx);
    return xxx;
  }

const dbToSvrText = (text) => {
	// first decrypt text of database
    let xxx = dbdecrypt(text);
	// now encrypt this for server
	xxx = encrypt(xxx);
    return xxx;
  }




async function sendCricMail (dest, mailSubject, mailText) {

  // setup to, subject and text
  mailOptions.to = dest;
  mailOptions.subject = mailSubject;
  mailOptions.text = mailText;
	console.log(mailOptions);
	
  try {
    const res = await send(mailOptions);
    return {status: true, error: 'Email Successfully sent'};
  } catch (e) {
    console.log(e);
    return {status: false, error: 'error sending Email'}; 
  }
} 


async function sendCricHtmlMail (dest, mailSubject, mailText) {

  // setup to, subject and text
  mailOptions.to = dest;
  mailOptions.subject = mailSubject;
  mailOptions.html = mailText;

  try {
    const res = await send(mailOptions);
    return {status: true, error: 'Email Successfully sent'};
  } catch (e) {
    console.log(e);
    return {status: false, error: 'error sending Email'}; 
  }
} 


/** calculate #time refill done by user till now **/
async function rechargeCount(userid) {
  let value = 0;
  let xxx = await Wallet.aggregate([
    {$match: {uid: parseInt(userid), isWallet: true, transType: WalletTransType.refill}},
    {$group : {_id : "$uid", count : {$sum : 1}}}
  ]);
  if (xxx.length === 1) value = xxx[0].count;
  return(value);
}

async function akshuGetUser(uid) {
  // let suid = uid.toString();
  let retUser = arun_user[uid];
  if (retUser) return retUser;

  if (debugTest) console.log(`read user ${uid} from database`);

  retUser = await User.findOne({uid: uid});
  if (retUser)
    arun_user[uid] = retUser;  // buffer this data
  return(retUser);
} 

function akshuUpdUser(userRec) {
  arun_user[userRec.uid] = userRec;
} 

async function akshuGetCustomer(cid) {
  // let suid = uid.toString();

  if (arun_customer.length === 0) {
    arun_customer = await M_Customer.find({});
  }
  let retUser = arun_customer.find(x => x.cid === cid);
  return retUser;
} 

async function akshuUpdateCustomer(cidData) {
  arun_customer = arun_customer.filter(x => x.cid !== cidData.cid);
  arun_customer.push(cidData);
  await cidData.save();
} 

async function akshuAddCustomer(cidData) {
  arun_customer.push(cidData);
  await cidData.save();;
} 

async function akshuDeleteCustomer(cidData) {
  arun_customer = arun_customer.filter(x => x.cid !== cidData.cid);
  await M_Customer.deleteOne({cid: cidData});
} 

async function getMaster(key) {
  let retVal =  arun_master.find(x => x.msKey === key);
  if (!retVal) {
    retVal = await M_MasterSetting.findOne({msKey: key});
    if (retVal) arun_master.push(retVal);
  }
  console.log(retVal.msValue);
  return (retVal) ? retVal.msValue : "";
}

async function setMaster(key, value) {
  let retVal =  arun_master.find(x => x.msKey === key);
  if (!retVal) {
    retVal = new M_MasterSetting();
    retVal.msKey = key;
    retVal.msValue = value;
    arun_master.push(retVal);
  } else {
    retVal.msValue = value;
  }
  await retVal.save();
  return
}

async function getCustomerNumber(userCid) {
	console.log(userCid);
	let customerRec = await M_Customer.findOne({_id: userCid});
	return ((customerRec) ? customerRec.customerNumber : 0);
}

async function getNewPid(userCid) {
	let newPid = 0;
	let customerNumber = await getCustomerNumber(userCid);
	//console.log(customerNumber);
	
	if (customerNumber > 0) {
		let d = new Date();
		//console.log(d.getYear());
		let offset = (d.getYear()-100) *100 + d.getMonth()+1;
		offset = (offset*100 + d.getDate())*100;
		//console.log(customerNumber*CUSTMF, offset);
		let startnum = customerNumber*CUSTMF + offset;
		let endnum = (customerNumber+1)*CUSTMF
		let myFilter = {"$gte": startnum, "$lt": endnum };
		let rec = await M_Patient.find({ pid: myFilter }).limit(1).sort({ pid: -1 });
		//console.log(rec);
		//console.log(startnum, endnum);
		newPid = (rec.length > 0) ? rec[0].pid + 1 : (startnum + 1);
	}
	//console.log(newPid);
	return newPid;
} 



async function getUserBalance(userid) {
  let tmp = {wallet: 0, bonus: 0};

  let xxx = await M_Wallet.aggregate([
    {$match: {cid: userid}},
    {$group : {_id : "$cid", balance : {$sum : "$amount"}}}
  ]);
  if (xxx.length === 1) tmp.wallet = xxx[0].balance;
	
  return tmp;
}

function numberDate(yr, mo, da) {
	return ((yr*100) + mo)*100 + da;
}

function intToString(n, sLen = 2)
{
	let x = "00000000000000000000000000000" + n;
	return x.slice(x.length-sLen, s.length);
}

ALPHABETSTR = [
"A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
"K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
"U", "V", "W", "X", "Y", "Z"
]

var ROOTDIR="";
function getRootDir() {
  if (ROOTDIR === "")
    ROOTDIR = process.cwd() + "/"
  return ROOTDIR;
} 

function getFileName(productName, productVersion, productType) {
  let myFile = getRootDir() + ARCHIVEDIR + 
    productName + "_" + 
    productVersion + "." + 
    productType;
  return myFile 
}

function fileExist(myFile) {
  status = fs.existsSync(myFile)
  return status;
}

function renameFile(oldfile, newFile) {
  // if new file already exists delete it
  if (fileExist(newFile))
    fs.unlinkSync(newFile);

    // now rename the file
  fs.renameSync(oldfile, newFile);
}

function deletefile(fileName) {
  if (fileExist(fileName))
    fs.unlinkSync(fileName);
}

function stringToBase64(originalString) {
	// The original utf8 string
	//let originalString = "GeeksforGeeks";
	// Create buffer object, specifying utf8 as encoding
	let bufferObj = Buffer.from(originalString, "utf8");	
	
	// Encode the Buffer as a base64 string
	let base64String = bufferObj.toString("base64");
	//console.log("The encoded base64 string is:", base64String);
	
	let b64String = Buffer.from(originalString).toString('base64')
	return b64String;
}

function base64ToString(base64string) {
	// The base64 encoded input string
	//let base64string = "R2Vla3Nmb3JHZWVrcw==";
		
	// Create a buffer from the string
	let bufferObj = Buffer.from(base64string, "base64");
	// Encode the Buffer as a utf8 string
	let decodedString = bufferObj.toString("utf8");
	//console.log("The decoded string:", decodedString);
	
	let norString = Buffer.from(base64string, 'base64').toString('ascii')
	return norString;
}

// return -1 if myDate < today
// returns 0 if my date = today
// return 1 if myDAte > today

function checkDate(myDate) {
		let today = new Date();
		if (myDate.getFullYear()  < today.getFullYear()) return -1;
		if (myDate.getFullYear()  > today.getFullYear()) return 1;
		
		if (myDate.getMonth() < today.getMonth()) return -1;
		if (myDate.getMonth() > today.getMonth()) return 1;
		
		if (myDate.getDate() < today.getDate()) return -1;
		if (myDate.getDate() > today.getDate()) return 1;
		
		return (0);	// date is same
}

function generateOrder(year, month, date, hour, minute) {
	let myOrder = ((year * 100 + month) * 100  + date)*100;
	myOrder = (myOrder + hour)*100 + minute;
	return myOrder;
}

function generateOrderByDate(d) {
	let myOrder = ((d.getFullYear() * 100 + d.getMonth()) * 100  + d.getDate())*100;
	myOrder = (myOrder + d.getHours())*100 + d.getMinutes();
	return myOrder;
}

async function setOldPendingAppointment(cid, pid, newStatus) {
	// get all pending appointment till just now
	let myOrder = generateOrderByDate(new Date());
	//console.log(myOrder);
	let myFilter = { cid: cid, pid: pid, visit: VISITTYPE.pending, order: { $lte: myOrder} }
	let myOldAppt = await M_Appointment.find(myFilter);
	//console.log(myOldAppt);
	for(let i=0; i<myOldAppt.length; ++i) {
		myOldAppt[i].visit = newStatus;
		await myOldAppt[i].save();
	}
}


function getMid(inp) {
	let mid = Math.round(inp*100);
  mid = Math.trunc(mid / 100) * FAMILYMF + (mid % 100);
  return mid;
}

async function fetchPinDetails(pinCode) {
  let newPinRec = await M_PinCode.findOne({pinCode: pinCode});
	console.log(pinCode);
	console.log(newPinRec);
	if (!newPinRec) {
		newPinRec = new M_PinCode();
		newPinRec.pinCode = pinCode;
		newPinRec.found = false;
		newPinRec.district = "";
		newPinRec.state = "";
		newPinRec.division = "";
		try {
			let myUrl = `https://api.postalpincode.in/pincode/${pinCode}`; 
			var tmp = await axios.get(myUrl);
			if (tmp.data[0].Status === 'Success') {
				newPinRec.district = tmp.data[0].PostOffice[0].District;
				newPinRec.state = tmp.data[0].PostOffice[0].State;
				newPinRec.division = tmp.data[0].PostOffice[0].Division;
				newPinRec.found = true;
				newPinRec.save();
			}
		} catch (e) {
			console.log("Error fetching pin code");
		}
	}
	return newPinRec;
}

function getMemberName(rec) {
	let tmp = `${rec.lastName} ${rec.firstName} ${rec.middleName}`;
	return tmp;
}

function getAge(xxx) {
  let d = new Date(xxx);
  let myyear = d.getFullYear();
  //console.log(d, myyear);
  let age = "-"
  if (myyear > 1900) {
    let tmp = (new Date().getTime() - d.getTime()) / 86400000;
    age = Math.round(tmp / 365).toString();
  }
	//console.log(age);
  return age;
}	
module.exports = {
	ALPHABETSTR,
  getLoginName, getDisplayName, getAge,
  encrypt, decrypt, dbencrypt, dbdecrypt,
  dbToSvrText, svrToDbText,
  sendCricMail, sendCricHtmlMail,
  // master
  getMaster, setMaster,
  // get
  akshuGetUser,
 
  // update
  akshuUpdUser,
  // delete
  // customer
  akshuGetCustomer, akshuAddCustomer, akshuUpdateCustomer, akshuDeleteCustomer,
  getUserBalance,
	rechargeCount,
	numberDate, intToString,
	stringToBase64, base64ToString,
	checkDate,
	getNewPid, getCustomerNumber,
	setOldPendingAppointment,
	generateOrder, generateOrderByDate,
  getMid,
  fetchPinDetails,
	getMemberName,
}; 

// mongodb+srv://pdhsamaj:YkEW2W4RBLyNsvo0@pdhs.drlqk.mongodb.net/test
