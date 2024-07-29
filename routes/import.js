const readXlsxFile = require('read-excel-file/node')

const {  akshuGetUser,   getLoginName, getDisplayName, 
  encrypt, decrypt, dbencrypt, dbToSvrText, svrToDbText, dbdecrypt,
	numberDate, getMid,
	fetchPinDetails,
} = require('./functions'); 
var router = express.Router();

var ROOTDIR="";
function getRootDir() {
  if (ROOTDIR === "")
    ROOTDIR = process.cwd() + "/"
  return ROOTDIR;
} 

function capitalizeFirstLetter(string) {
	let tmp =  string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	console.log(tmp);
  return tmp;
}


/* GET users listing. */
router.use('/', function(req, res, next) {
  // WalletRes = res;
  setHeader(res);
  if (!db_connection) { senderr(res, DBERROR, ERR_NODB); return; }
	//console.log("Hi");
	
  next('route');
});


router.get('/hod', async function (req, res) {
  setHeader(res);
  
	var filePath = getRootDir() + ARCHIVEDIR + "import/hod.xlsx";
	console.log(filePath);

	if (!fs.existsSync(filePath))  return senderr(res, 601, "HOD file not found");

	// File path.
	await M_Hod.deleteMany({});
	readXlsxFile(filePath).then((rows) => {
		// `rows` is an array of rows
		// each row being an array of cells.
		console.log(rows.length);

		for(let i = 1; i<rows.length; ++i) {
			let myData = rows[i];
			//if (myData[2] === 'Data NA') continue;

			let mid = Math.round(myData[1]*100);
			mid = Math.trunc(mid / 100) * FAMILYMF + (mid % 100);
			console.log(myData[0], myData[1], mid);

			let myRec = new M_Hod();
			myRec.hid = myData[0];
			myRec.mid = mid;
			myRec.gotra = (myData[3].includes("NA")) ? "" : myData[3];
			myRec.village = (myData[4].includes("NA")) ? "" : myData[4];

			let xxx = (myData[5] == null) ? "" : myData[5].trim().split(',');
			myRec.resAddr1 = (xxx.length > 0) ? xxx[0].trim() : "";
			myRec.resAddr2 = (xxx.length > 1) ? xxx[1].trim() : "";
			myRec.resAddr3 = (xxx.length > 2) ? xxx[2].trim() : "";
			myRec.resAddr4 = (xxx.length > 3) ? xxx[3].trim() : "";
			myRec.resAddr5 = (xxx.length > 4) ? xxx[4].trim() : "";
			myRec.resAddr6 = (xxx.length > 5) ? xxx[5].trim() : "";

			console.log(myRec.resAddr1, myRec.resAddr2, myRec.resAddr3, myRec.resAddr4);

			myRec.suburb = (myData[6]) ? myData[6] : "";
			myRec.city = ( myData[7]) ? myData[7] : "";
			myRec.pinCode = (myData[8]) ? myData[8] : 0;
			myRec.district = (myData[9]) ? myData[9] : "";
			myRec.state = (myData[10]) ? myData[10] : "";
			myRec.resPhone1 = (myData[11]) ? myData[11] : "";
			myRec.resPhone2 = (myData[12]) ? myData[12] : "";
			myRec.save();
		}
	})

	sendok(res, "OK");
});


router.get('/member', async function (req, res) {
  setHeader(res);
  
	var filePath = getRootDir() + ARCHIVEDIR + "import/family.xlsx";
	console.log(filePath);

	if (!fs.existsSync(filePath))  return senderr(res, 601, "Member file not found");
	let allHods = await M_Hod.find({active: true});
	// File path.
	await M_Member.deleteMany({});
	readXlsxFile(filePath).then((rows) => {
		// `rows` is an array of rows
		// each row being an array of cells.
		console.log(rows.length);

		for(let i = 1; i<rows.length; ++i) {
			let myData = rows[i];

			// first check if hod record is there
			let myHod = allHods.filter(x => x.hid == myData[0]);
			console.log(myHod.length);
			if (myHod.length !== 1) {
				console.log(`HOD ${myData[0]} not available. Ignoring this family record of ${myData[2]}`);
				continue;
			}

			//if (myData[2] === 'Data NA') continue;
			//console.log(myData[0], Math.round(myData[1]*FAMILYMF));

			let mid = Math.round(myData[2]*100);
			mid = Math.trunc(mid / 100) * FAMILYMF + (mid % 100);
			console.log(myData[0], myData[2], mid);

			let myRec = new M_Member();
			myRec.hid = myData[0];
			myRec.mid = mid;			//Math.round(myData[2]*FAMILYMF);

			myRec.title = capitalizeFirstLetter(myData[3].trim());
			myRec.lastName = capitalizeFirstLetter(myData[4].trim());
			myRec.firstName =capitalizeFirstLetter(myData[5].trim());
			myRec.middleName = capitalizeFirstLetter(myData[6].trim());
			myRec.alias = (myData[7]) ? capitalizeFirstLetter(myData[7].trim()) : "";
			myRec.relation = capitalizeFirstLetter(myData[8].trim());
			myRec.gender = capitalizeFirstLetter(myData[9].trim());
			myRec.dob = (myData[10] !== "") ? new Date(myData[10]) : new Date(1900, 0, 1);

			myRec.bloodGroup = (myData[11]) ? capitalizeFirstLetter(myData[11].trim()) : ""
			
			myRec.emsStatus = (myData[12]) ? myData[12].trim() : "";
			myRec.education = (myData[13]) ? myData[13].trim() : ""; 
			myRec.educationLevel =(myData[14]) ?  myData[14].trim() : "";
			myRec.educationCategory = (myData[15]) ? myData[15].trim() : "";
			myRec.educationField = (myData[16]) ?  myData[16].trim() : "";
			
			myRec.occupation = (myData[17]) ? myData[17].trim() : "";
			myRec.mobile = (myData[18]) ?  myData[18].trim() : "";
			let tmp = (myData[19]) ?  myData[19].toLowerCase().trim() : "-";
			myRec.email = dbencrypt(tmp);  //dbencrypt(tmp);

			myRec.officeName = (myData[20]) ? myData[20].trim() : "";
			myRec.officeAddr1 = (myData[21]) ? myData[21].trim() : "";
			myRec.officeAddr2 = (myData[22]) ? myData[22].trim() : "";
			myRec.officePhone = (myData[23]) ? myData[23].trim() : "";

			myRec.mobile1 = (myData[24]) ? myData[24].toLowerCase().trim() : "";
			tmp = (myData[25]) ?  myData[25].trim() : "-";
			myRec.email1 = dbencrypt(tmp);

			//console.log(myData[26]);
			myRec.ceased = myData[26];
			tmp = "";
			if (myData[27]) tmp = myData[27];
			//console.log(tmp);
			myRec.ceasedDate = ((myRec.ceased) && (tmp !== "")) ? new Date(tmp) : new Date(1900, 0, 1);

			myRec.save();
		}
	})

	sendok(res, "OK");
});


router.get('/humad', async function (req, res) {
  setHeader(res);
  let tmp;

	var filePath = getRootDir() + ARCHIVEDIR + "import/humad.xlsx";
	console.log(filePath);

	if (!fs.existsSync(filePath))  return senderr(res, 601, "Humad file not found");

	let rows =  await readXlsxFile(filePath); 
	console.log(rows.length);

	await M_Humad.deleteMany({});
	for(let i = 1; i<rows.length; ++i) {
		let myData = rows[i];

		let mid = getMid(myData[2]);
		if ([193001].includes(mid)) {
			console.log(`Skipping record of ${mid}`);
			continue;
		}
		//console.log("MID is ",mid);
		
		let myMember = await M_Member.findOne({mid: mid});
		if (!myMember) {
			console.log(`Member ${mid} not in Member database`);
			continue;
		}
		
		let myRec = new M_Humad();
		
		myRec.hid = myMember.hid;
		myRec.mid = mid;			
		myRec.membershipNumber = myData[0].replace(/"/g,"");
		
		myRec.membershipDate = (myData[3] !== "") ? new Date(myData[3]) : new Date(1900, 0, 1, 0, 0, 0);

		myRec.membershipReceipt = "";
		
		tmp = (myData[7]) ? myData[7].replace(/"/g,"") : "";
		myRec.remarks = tmp;
		//console.log(myData[8]);
		myRec.upgradeIndex = 0;				///(!myData[8]) ? MAGICNUMBER : 1;

		myRec.active = !myData[8];
		await myRec.save();
		
		if (myRec.active) {
			myMember.humadMember = true;
			await myMember.save();
		}
	}

	console.log("Done");
	sendok(res, "OK");
});

router.get('/humadorder1', async function (req, res) {
  setHeader(res);
  
	let oldHumads = await M_Humad.find({upgradeIndex: {$ne: MAGICNUMBER}});
	//console.log(oldHumads);
	let oldMid = _.map(oldHumads, 'mid');
	oldMid = _.uniqBy(oldMid);
	//console.log(oldMid);	
	for(let i=0; i<oldMid.length; ++i) {
		let myRecs = oldHumads.filter(x => x.mid === oldMid[i]);
		//console.log(myRecs.length);
		if (myRecs.length === 1) continue;
		console.log(oldMid[i]);
		myRecs = _.sortBy(myRecs, 'membershipDate');
		for(let m=0; m<myRecs.length; ++m) {
			myRecs[m].upgradeIndex = m+1;
			myRecs[m].save();
		}
	}

	sendok(res, oldMid);
});

router.get('/order', async function (req, res) {
	setHeader(res); 
	let allHods = await M_Hod.find({active: true});
	for(let i = 1; i < allHods.length; ++i) {
		let myHod = allHods[i];
		let myData = await M_Member.find({hid: myHod.hid}).sort({mid: 1});
		
		// bring HOD family member at the top
		let hodRec = myData.filter(x => x.mid === myHod.mid);
		let nonhodRec =  myData.filter(x => x.mid !== myHod.mid);
		let allMerged = hodRec.concat(nonhodRec);

		for(let m=0; m < allMerged.length; ++m) {
			allMerged[m]["order"] = m;
			allMerged[m].save();
			console.log(allMerged[m]);
		}
	}
	sendok(res, "OK");
});

router.get('/emailencrypt', async function (req, res) {
  setHeader(res);

	let myData = await M_Member.find({});
	//console.log(myData);
	for(let i = 0; i < myData.length; ++i) {
		myData[i].email = dbencrypt(myData[i].email);
		myData[i].email1 = dbencrypt(myData[i].email1);

	}
	sendok(res, "OK");
});

router.get('/gotra', async function (req, res) {
	setHeader(res);
	let gList = [];
	let allHods = await M_Hod.find({active: true});
	for(let i=0; i<allHods.length; ++i) {
		let myGotra = getLoginName(allHods[i].gotra);
		var dname = getDisplayName(allHods[i].gotra);
		if (allHods[i].gotra !== dname) {
			allHods[i].gotra = dname;
			await allHods[i].save();
		}
		let tmp = gList.filter(x => x.id === myGotra);
		if (tmp.length === 0) {
			gList.push({id: myGotra, name: dname});
		}
	} 
	await M_Gotra.deleteMany({});
	for(let i=0; i<gList.length; ++i) {
		let gRec = new M_Gotra();
		gRec.id = gList[i].id;
		gRec.name = gList[i].name;
		gRec.enabled = true;
		await gRec.save();
	}

	sendok(res, gList);
});

router.get('/listgotra', async function (req, res) {
	setHeader(res);
	let myData = await M_Gotra.find({}).sort({id: 1});
	sendok(res, myData);
});

router.get('/listfamily/:hid', async function (req, res) {
	setHeader(res);
	var {hid} = req.params;
	let myData = await M_Member.find({hid: Number(hid)}).sort({mid: 1});
	sendok(res, myData);
});

router.get('/listhod/:hid', async function (req, res) {
	setHeader(res);
	var {hid} = req.params;
	let myData = await M_Hod.findOne({hid: Number(hid)});
	sendok(res, myData);
});

router.get('/caste', async function (req, res) {
	setHeader(res);
	let allHods = await M_Hod.find({active: true});
	for(let i = 0; i<allHods.length; ++i) {
		console.log("Record "+i);
		allHods[i].caste = 'Humad';
		allHods[i].subCaste = 'Dasha';
		allHods[i].save();
	}
	sendok(res, "OK");
});

router.get('/updatepindetails', async function (req, res) {
	setHeader(res);
	let allHods = await M_Hod.find({active: true});
	let allPins = await M_PinCode.find({});
	console.log(allHods.length, allPins.length);
	for(let i = 0; i<allHods.length; ++i) {
		let myPin = allPins.find(x => x.pinCode == allHods[i].pinCode);
		console.log(allHods[i].pinCode);
		if (myPin) {
			console.log("Updating");
			allHods[i].district = myPin.district;
			allHods[i].division = myPin.division;
			allHods[i].state = myPin.state;
			await allHods[i].save();
		}
	}
	console.log("PICCODE update over");
	sendok(res, "OK");
});

router.get('/pincode', async function (req, res) {
	setHeader(res);
	console.log("Starting PICCODE fetch");
	let allHods = await M_Hod.find({active: true});
	let allPins = _.map(allHods, 'pinCode');
	allPins = _.uniqBy(allPins);
	allPins = _.sortBy(allPins);
	//allPins = allPins.filter(x => x !== 0);
	console.log(allPins.length);
		
	for(let i = 0; i<allPins.length; ++i) {
		let myPin = allPins[i];
		let myPinRec = await M_PinCode.findOne({pinCode: myPin});
		if (!myPinRec) {
			console.log("Pin code "+myPin+" not in database");
			myPinRec = await fetchPinDetails(myPin);			
			if (myPinRec.found) {
				//console.log("Updated");
				//await myPinRec.save();
			} else {
				console.log(myPin + "Not Found  -------------------");
			}
		}
	}
	console.log("PICCODE fetch over");
	sendok(res, "OK");
});

router.get('/testpin', async function (req, res) {
	setHeader(res);
	console.log("Starting PICCODE fetch");
	let allHods = await M_Hod.find({active: true});
	let allPins = _.map(allHods, 'pinCode');
	allPins = _.uniqBy(allPins);
	allPins = _.sortBy(allPins);
	//allPins = allPins.filter(x => x !== 0);
	console.log(allPins.length);
		
	for(let i = 0; i<allPins.length; ++i) {
		let myPin = allPins[i];
		let myPinRec = await M_PinCode.find({pinCode: myPin});
		if (myPinRec.length !== 1)
			console.log(myPin+" Count: "+myPinRec.length);
	}
	console.log("PICCODE fetch over");
	sendok(res, "OK");
});


router.get('/spouse', async function (req, res) {
	setHeader(res);

	let allMembers = await M_Member.find({});
	for(let i = 0; i<allMembers.length; ++i) {
	
		allMembers[i].spouseMid = 0;
		allMembers[i].dateOfMarriage = new Date(1900, 0, 1, 0, 0, 0)
		allMembers[i].save();
	}
	sendok(res, "OK");
});


router.get('/updaterelation/:oldRel/:newRel', async function (req, res) {
	setHeader(res);
	var {oldRel, newRel } = req.params;

	let allMembers = await M_Member.find({ relation: oldRel });
	for (let m=0; m<allMembers.length; ++m) {
		allMembers[m].relation = newRel;
		await allMembers[m].save();
		
	}	
	sendok(res, "OK");
});

router.get('/officeaddress', async function (req, res) {
	setHeader(res);

	let myData = await M_Member.find({hid: 1});
	var myData1 = await _.map(myData, function (row) {
    return _.omit(row, ['officeAddr1', 'officeAddr2']);
	});

	console.log(myData1);
	sendok(res, myData1);
});
	
router.get('/temp', async function (req, res) {
	setHeader(res);

	let myData = await M_Humad.find({});
	for(let i=0; i<myData.length; ++i) {
		myData[i].remarks = myData[i].remarks.trim().replace("T\\FROM", "T\/F");
		await myData[i].save();
	}
	console.log("Done");
	sendok(res, "Done");
});
	

router.get('/matchmaking', async function (req, res) {
	setHeader(res);

	let allHods = await M_Hod.find({active: true}).sort({hid: 1});
	for (let h=0; h<allHods.length; ++h) {
		let allMembers = await M_Member.find({ hid: allHods[h].hid, emsStatus: 'Married',  ceased: false });
		if (allMembers.length === 0) continue;
		console.log(`Updating spouse details of HOD ${allHods[h].hid}`);
		let allGrooms = allMembers.filter(x => x.gender === 'Male');
		let allBride  = allMembers.filter(x => x.gender === 'Female');
		for(let g=0; g<allGrooms.length; ++g) {
			let myBride = allBride.find(x => 
				x.lastName.toLowerCase() === allGrooms[g].lastName.toLowerCase() &&
				x.middleName.toLowerCase() === allGrooms[g].firstName.toLowerCase()
			);
			if (myBride) {
				allGrooms[g].spouseMid = myBride.mid;
				myBride.spouseMid = allGrooms[g].mid;
				await allGrooms[g].save();
				await myBride.save();
			}
		}
	}	
	sendok(res, "OK");
});

router.get('/pjym', async function (req, res) {
  setHeader(res);
  let tmp;
	IGNOREHOD = [149, 242];
	
	var filePath = getRootDir() + ARCHIVEDIR + "import/pjym.xlsx";
	console.log(filePath);

	if (!fs.existsSync(filePath))  return senderr(res, 601, "PJYM file not found");
	
	await M_Pjym.deleteMany({});
	let rows = await readXlsxFile(filePath);

	console.log(rows.length);

	for(let i = 1; i<rows.length; ++i) {
		let myData = rows[i];

		let hid = myData[2];
		if (IGNOREHOD.includes(hid)) {
			console.log("skipping record of HOD "+hid);
			continue;
		}
		
		let mid = getMid(myData[1]);
		let memberRec = await M_Member.findOne({mid: mid});
		if (!memberRec) {
			console.log(`Member ${mid} not in Member database`);
			continue;
		}
		
		//console.log(`Processing record of ${mid}`);
		let myRec = new M_Pjym();
		myRec.hid = memberRec.hid;
		myRec.mid = mid;			
		myRec.membershipNumber = myData[0];
		myRec.membershipDate = (myData[7] !== "") ? new Date(myData[7]) : new Date(1900, 0, 1);
		myRec.membershipReceipt = ( myData[6]) ? myData[6] : "0";
		myRec.active = !memberRec.ceased;
		myRec.upgradeIndex = 0;
		await myRec.save();
		
		// set member as true if not ceased
		memberRec.pjymMember = true;

		// if date of marriage available update in member as well as in spouse
		if (myData[3] !== "") {
			let dom = new Date(myData[3]);
			memberRec.dateOfMarriage = dom;
			await memberRec.save();
			if (memberRec.spouseMid !== 0) {
				memberRec = await M_Member.findOne({mid: memberRec.spouseMid});
				if (memberRec) {
					memberRec.dateOfMarriage = dom;
					await memberRec.save();
				}
			}
		}
	
	}

	console.log("Done");
	sendok(res, "OK");
});

	

function getDate(x) {
	let y = ("0" + x.getDate()).slice(-2) + "/" +
		("0" + (x.getMonth()+1)).slice(-2) + "/" +
		x.getFullYear();
	return y;
}



function sendok(res, usrmsg) { res.send(usrmsg); }
function senderr(res, errcode, errmsg) { res.status(errcode).send(errmsg); }
function setHeader(res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
}

module.exports = router;
