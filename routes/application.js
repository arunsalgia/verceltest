const {
	encrypt, decrypt, dbencrypt, dbToSvrText, svrToDbText, dbdecrypt,
  akshuGetUser, GroupMemberCount,  
	numberDate, 
	getMemberName
} = require('./functions'); 

const { 
	memberGetByMidOne, memberUpdateOne,
	memberGetByHidMany,memberUpdateMany,
} = require('./dbfunctions'); 

var router = express.Router();


/* GET users listing. */
router.use('/', function(req, res, next) {
  // WalletRes = res;
  setHeader(res);
  if (!db_connection) { senderr(res, DBERROR, ERR_NODB); return; }
  next('route');
});

function partFind(name) {
return { $regex: name, $options: "i" }
}


router.get('/list', async function (req, res) {
  setHeader(res);

	let myData = await M_Application.find({}).sort({id: -1});
	//console.log(myData);
	sendok(res, myData);
});		

router.get('/list/:mid', async function (req, res) {
  setHeader(res);
	var {mid } = req.params;

	let myData = await M_Application.find({mid: mid}).sort({id: -1});
	sendok(res, myData);
});		

router.get('/add/:appData', async function (req, res) {
  setHeader(res);
	var {appData } = req.params;
	appData = JSON.parse(appData);

	let aRec = new M_Application();
	aRec.owner = appData.owner;
	aRec.desc = appData.desc;
	aRec.name = appData.name;
	aRec.hid = appData.hid;
	aRec.mid = appData.mid;
	aRec.isMember = appData.isMember;
	aRec.data = JSON.stringify(appData.data);
	aRec.status = 'Pending';
	aRec.adminName = '';
	aRec.comments = '';
	//console.log(appData.data);
	
	let justNow = new Date();
	let baseid =  (((justNow.getFullYear() * 100) + justNow.getMonth() + 1) * 100 + justNow.getDate()) * 1000;
	//console.log(baseid);
	let tmp = await M_Application.find({id: {$gt: baseid}}).limit(1).sort({id: -1});
	
	aRec.date = justNow;
	aRec.id = (tmp.length > 0) ? tmp[0].id + 1 : baseid + 1;
	await aRec.save();
	//console.log(aRec);
	
	sendok(res, aRec);
});


router.get('/delete/:id', async function (req, res) {
  setHeader(res);
	var {id } = req.params;
	
	await M_Application.deleteOne({id: id});

	sendok(res, "Done");
});


router.get('/editfamilydetails/:editor_mid/:appData', async function (req, res) {
  setHeader(res);
	var {editor_mid, appData } = req.params;
	appData = JSON.parse(appData);

	var editorRec = await memberGetByMidOne(Number(editor_mid));
	
	let aRec = new M_Application();
	aRec.owner = "PRWS";
	aRec.desc = "Edit Family details";
	aRec.name = getMemberName(editorRec);
	aRec.mid = editorRec.mid;
	aRec.isMember = true;
	aRec.data = JSON.stringify(appData.data);
	aRec.status = 'Pending';
	aRec.adminName = '';
	aRec.comments = '';
	//console.log(appData.data);
	
	let justNow = new Date();
	let baseid =  (((justNow.getFullYear() * 100) + justNow.getMonth() + 1) * 100 + justNow.getDate()) * 1000;
	//console.log(baseid);
	let tmp = await M_Application.find({id: {$gt: baseid}}).limit(1).sort({id: -1});
	
	aRec.date = justNow;
	aRec.id = (tmp.length > 0) ? tmp[0].id + 1 : baseid + 1;
	await aRec.save();
	//console.log(aRec);
	
	sendok(res, aRec);
});

router.get('/updategotra/:editor_hodmid/:editor_mid/:appData', async function (req, res) {
  setHeader(res);
	var {editor_mid, editor_hodmid, appData } = req.params;
	//console.log(appData);
	let justNow = new Date();

	var editorRec = await memberGetByMidOne(Number(editor_mid));
	var editorHodRec = await memberGetByMidOne(Number(editor_hodmid));
	//console.log(editor_hodmid, editorHodRec);
	
	let aRec = new M_Application();
	aRec.date = justNow;
	aRec.owner = OWNER.prws;
	aRec.hid = 0;
	aRec.desc = APPLICATIONTYPES.editGotra;

	aRec.hodMid = editorHodRec.mid
	aRec.hodName = getMemberName(editorHodRec, false);

	aRec.mid = editorRec.mid;
	aRec.name = getMemberName(editorRec, false);

	aRec.isMember = true;
	aRec.data = appData;
	aRec.status = APPLICATIONSTATUS.pending;

	aRec.adminName = '';
	aRec.comments = '';
	
	let baseid =  (((justNow.getFullYear() * 100) + justNow.getMonth() + 1) * 100 + justNow.getDate()) * 1000;
	//console.log(baseid);
	let tmp = await M_Application.find({id: {$gt: baseid}}).limit(1).sort({id: -1});
	
	aRec.id = (tmp.length > 0) ? tmp[0].id + 1 : baseid + 1;
	//await aRec.save();
	//console.log(aRec);
	
	sendok(res, aRec);
});

router.get('/ceased/:editor_hodmid/:editor_mid/:appData', async function (req, res) {
  setHeader(res);
	var {editor_hodmid, editor_mid, appData } = req.params;
	//console.log(appData);
	let justNow = new Date();

	var editorRec = await memberGetByMidOne(Number(editor_mid));
	var editorHodRec = await memberGetByMidOne(Number(editor_hodmid));
	//console.log(editor_hodmid, editorHodRec);
	
	let aRec = new M_Application();
	aRec.date = justNow;
	aRec.owner = OWNER.prws;
	aRec.hid = 0;
	aRec.desc = APPLICATIONTYPES.memberCeased;

	aRec.hodMid = editorHodRec.mid
	aRec.hodName = getMemberName(editorHodRec, false);

	aRec.mid = editorRec.mid;
	aRec.name = getMemberName(editorRec, false);

	aRec.isMember = true;
	aRec.data = appData;
	aRec.status = APPLICATIONSTATUS.pending;

	aRec.adminName = '';
	aRec.comments = '';
	
	let baseid =  (((justNow.getFullYear() * 100) + justNow.getMonth() + 1) * 100 + justNow.getDate()) * 1000;
	//console.log(baseid);
	let tmp = await M_Application.find({id: {$gt: baseid}}).limit(1).sort({id: -1});
	
	aRec.id = (tmp.length > 0) ? tmp[0].id + 1 : baseid + 1;

	sendok(res, aRec);

	await aRec.save();
	//console.log(aRec);
});


router.get('/newhod/:editor_hodmid/:editor_mid/:appData', async function (req, res) {
  setHeader(res);
	var {editor_hodmid, editor_mid, appData } = req.params;
	//console.log(appData);
	let justNow = new Date();

	var editorRec = await memberGetByMidOne(Number(editor_mid));
	var editorHodRec = await memberGetByMidOne(Number(editor_hodmid));
	//console.log(editor_hodmid, editorHodRec);
	
	let aRec = new M_Application();
	aRec.date = justNow;
	aRec.owner = OWNER.prws;
	aRec.hid = 0;
	aRec.desc = APPLICATIONTYPES.newHod;

	aRec.hodMid = editorHodRec.mid
	aRec.hodName = getMemberName(editorHodRec, false);

	aRec.mid = editorRec.mid;
	aRec.name = getMemberName(editorRec, false);

	aRec.isMember = true;
	aRec.data = appData;
	aRec.status = APPLICATIONSTATUS.pending;

	aRec.adminName = '';
	aRec.comments = '';
	
	let baseid =  (((justNow.getFullYear() * 100) + justNow.getMonth() + 1) * 100 + justNow.getDate()) * 1000;
	//console.log(baseid);
	let tmp = await M_Application.find({id: {$gt: baseid}}).limit(1).sort({id: -1});
	
	aRec.id = (tmp.length > 0) ? tmp[0].id + 1 : baseid + 1;

	sendok(res, aRec);

	await aRec.save();
	//console.log(aRec);
});

router.get('/movemember/:editor_hodmid/:editor_mid/:appData', async function (req, res) {
  setHeader(res);
	var {editor_mid, editor_hodmid, appData } = req.params;
	//console.log(appData);
	let justNow = new Date();

	var editorRec = await memberGetByMidOne(Number(editor_mid));
	var editorHodRec = await memberGetByMidOne(Number(editor_hodmid));
	//console.log(editor_hodmid, editorHodRec);
	
	let aRec = new M_Application();
	aRec.date = justNow;
	aRec.owner = OWNER.prws;
	aRec.hid = 0;
	aRec.desc = APPLICATIONTYPES.transferMember;

	aRec.hodMid = editorHodRec.mid
	aRec.hodName = getMemberName(editorHodRec, false);

	aRec.mid = editorRec.mid;
	aRec.name = getMemberName(editorRec, false);

	aRec.isMember = true;
	aRec.data = appData;
	aRec.status = APPLICATIONSTATUS.pending;

	aRec.adminName = '';
	aRec.comments = '';
	
	let baseid =  (((justNow.getFullYear() * 100) + justNow.getMonth() + 1) * 100 + justNow.getDate()) * 1000;
	//console.log(baseid);
	let tmp = await M_Application.find({id: {$gt: baseid}}).limit(1).sort({id: -1});
	
	aRec.id = (tmp.length > 0) ? tmp[0].id + 1 : baseid + 1;
	await aRec.save();
	//console.log(aRec);
	
	sendok(res, aRec);
});


router.get('/addeditpersonal/:editor_hodmid/:editor_mid/:appData', async function (req, res) {
  setHeader(res);
	var {editor_hodmid, editor_mid, appData } = req.params;
	//console.log(appData);
	var xxx = JSON.parse(appData);
	
	let justNow = new Date();

	var editorRec = await memberGetByMidOne(Number(editor_mid));
	var editorHodRec = await memberGetByMidOne(Number(editor_hodmid));
	//console.log(editor_hodmid, editorHodRec);
	
	let aRec = new M_Application();
	aRec.date = justNow;
	aRec.owner = OWNER.prws;
	aRec.hid = 0;
	aRec.desc = (xxx.mode === "Add") ? APPLICATIONTYPES.addMember : APPLICATIONTYPES.editMember ;

	aRec.hodMid = editorHodRec.mid
	aRec.hodName = getMemberName(editorHodRec, false);

	aRec.mid = editorRec.mid;
	aRec.name = getMemberName(editorRec, false);

	aRec.isMember = true;
	aRec.data = appData;
	aRec.status = APPLICATIONSTATUS.pending;

	aRec.adminName = '';
	aRec.comments = '';
	
	let baseid =  (((justNow.getFullYear() * 100) + justNow.getMonth() + 1) * 100 + justNow.getDate()) * 1000;
	//console.log(baseid);
	let tmp = await M_Application.find({id: {$gt: baseid}}).limit(1).sort({id: -1});
	
	aRec.id = (tmp.length > 0) ? tmp[0].id + 1 : baseid + 1;

	sendok(res, aRec);

	await aRec.save();
	//console.log(aRec);
});



router.get('/reject/:id/:adminMid/:comments', async function (req, res) {
  setHeader(res);
	var {id, adminMid,comments } = req.params;
	
	//console.log(id, comments, adminMid);
	var adminRec = await memberGetByMidOne(Number(adminMid));
	
	let aRec = await M_Application.findOne({id: id});
	aRec.status = APPLICATIONSTATUS.rejected;
	aRec.adminMid = adminRec.mid;
	aRec.adminName = getMemberName(adminRec, false);
	aRec.comments = comments;
	await aRec.save();
	//console.log(aRec);
	
	sendok(res, aRec);
});

router.get('/approve/:id/:adminMid/:comments', async function (req, res) {
  setHeader(res);
	var {id, adminMid,comments } = req.params;
	
	//console.log(id, comments, adminMid);

	let aRec = await M_Application.findOne({id: id});
	if (!aRec) return senderr(res, 601, 'Application not found');
	
	var myStatus = {status: false, record: null};
	switch (aRec.desc) {
		case APPLICATIONTYPES.editMember:
			retObject = await approve_editMember(aRec);
			break;
		case APPLICATIONTYPES.memberCeased:
			retObject = await approve_memberCeased(aRec);
			break;
		case APPLICATIONTYPES.newHod:
			retObject = await approve_newHod(aRec);
			break;
		default:
			return senderr(res, 602, 'Invalid application type');
	}
	
	if (!retObject.status) return senderr(res, 603, 'Error approving data');

	// Update application record
	var adminRec = await memberGetByMidOne(Number(adminMid));	
	
	aRec.status = APPLICATIONSTATUS.approved;
	aRec.adminMid = adminRec.mid;
	aRec.adminName = getMemberName(adminRec, false);
	aRec.comments = comments;
	sendok(res, aRec);
		
	//console.log(aRec);
	await aRec.save();	
});

// Approval functions

async function approve_editMember(aRec) {
	var myData = JSON.parse(aRec.data);
	//console.log(myData);
	var myRec = await memberGetByMidOne(myData.oldMemberRec.mid);
	// Update Name details
	if (myData.memberRec.title) {
		myRec.title = myData.memberRec.title;
	}
	if (myData.memberRec.firstName) {
		myRec.firstName = myData.memberRec.firstName;
	}
	if (myData.memberRec.lastName) {
		myRec.lastName = myData.memberRec.lastName;
	}	
	if (myData.memberRec.middleName) {
		myRec.middleName = myData.memberRec.middleName;
	}		
	if (myData.memberRec.alias) {
		myRec.alias = myData.memberRec.alias;
	}			
	// Update personal details
	if (myData.memberRec.relation) {
		myRec.relation = myData.memberRec.relation;
	}			
	if (myData.memberRec.gender) {
		myRec.gender = myData.memberRec.gender;
	}			
	if (myData.memberRec.dob) {
		myRec.dob = myData.memberRec.dob;
	}			
	if (myData.memberRec.bloodGroup) {
		myRec.bloodGroup = myData.memberRec.bloodGroup;
	}			
	// Update Marital status
		// to be implemented
	// Update other details
	if (myData.memberRec.mobile) {
		myRec.mobile = myData.memberRec.mobile;
	}	
	if (myData.memberRec.mobile1) {
		myRec.mobile1 = myData.memberRec.mobile1;
	}	
	if (myData.memberRec.email) {
		myRec.email = svrToDbText(myData.memberRec.email);
	}	
	// Office details
	if (myData.memberRec.occupation) {
		myRec.occupation = myData.memberRec.occupation;
	}			
	if (myData.memberRec.education) {
		myRec.education = myData.memberRec.education;
	}			
	if (myData.memberRec.officeName) {
		myRec.officeName = myData.memberRec.officeName;
	}			
	if (myData.memberRec.officePhone) {
		myRec.officePhone = myData.memberRec.officePhone;
	}			

	//console.log(myRec);
	await memberUpdateOne(myRec);
	return {status: true, record: myRec};
}

// Member ceased approve
async function approve_memberCeased(aRec) {
	var myData = JSON.parse(aRec.data);
	//console.log(myData);
	// Get all the members of the family
	var otherMembers = await memberGetByHidMany(myData.hid);
	// ceased record and other member record
	var ceasedRec = otherMembers.find(x => x.mid === myData.ceasedMid);
	otherMembers = _.sortBy(otherMembers.filter(x => x.mid !== myData.ceasedMid), 'order');
	// if new Hod, then bring it to the top
	if (myData.newHodMid !== 0) {
		var tmp = otherMembers.find(x => x.mid === myData.newHodMid);
		otherMembers = [tmp].concat(otherMembers.filter(x => x.mid !== myData.newHodMid));
	}
	
	// first ceasedRec Update
	ceasedRec.ceased = true;
	await memberUpdateOne(ceasedRec);
	
	// Now set the relation. HOd is always "Self"
	for (var i = 0; i<myData.midList.length; ++i) {
		var tmpRec = otherMembers.find(x => x.mid === myData.midList[i]);
		if (tmpRec.mid === myData.newHodMid)
			tmpRec.relation = "Self";
		else
			tmpRec.relation = myData.relationList[i];
	}
	
	// set order for balance Family
	for(var i=0; i<otherMembers.length; ++i) {
		otherMembers[i].order = i;
	}
	
	// UPdate spouseMid & emsStatus if required
	if (ceasedRec.spouseMid !== 0) {
		var tmp = otherMembers.find(x => x.mid === ceasedRec.spouseMid);
		tmp.spouseMid = 0;		// SPouse not alive
		tmp.emsStatus = (tmp.gender === "Female") ? "Widow" : "Widower";
	}

	// update all members data
	await memberUpdateMany(otherMembers);
	
	// If new hod then update HOD record
	if (myData.newHodMid !== 0) {
		var hodRec = await M_Hod.findOne({hid: myData.hid});
		hodRec.mid = myData.newHodMid;
		await hodRec.save();
	}
	// All done

	return {status: true, record: ceasedRec};
}

// Member new Hod approve
async function approve_newHod(aRec) {
	var myData = JSON.parse(aRec.data);
	//console.log(myData);
	// Get all the members of the family
	var otherMembers = await memberGetByHidMany(myData.hid);
	// ceased record and other member record
	var newHodRec = otherMembers.find(x => x.mid === myData.newHodMid);
	otherMembers = _.sortBy(otherMembers.filter(x => x.mid !== myData.newHodMid), 'order');

	// HOD is Self and has order 0 (at top)
	newHodRec.relation = 'Self';
	newHodRec.order = 0;

	// Now set the relation of others
	for (var i = 0; i<myData.midList.length; ++i) {
		var tmpRec = otherMembers.find(x => x.mid === myData.midList[i]);
		tmpRec.relation = myData.relationList[i];
	}

	// set order for balance Family
	for(var i=0; i<otherMembers.length; ++i) {
		otherMembers[i].order = i+1;
	}

	// update all members data
	await memberUpdateOne(newHodRec);
	await memberUpdateMany(otherMembers);
	
	// Update new hod in HOD record
	var hodRec = await M_Hod.findOne({hid: myData.hid});
	hodRec.mid = myData.newHodMid;
	await hodRec.save();

	// All done
	return {status: true, record: newHodRec};
}


router.get('/test', async function (req, res) {
  setHeader(res);
	var {id, adminName,comments } = req.params;
	
	let allRec = await M_Application.find({});
	for(var i=0; i<allRec.length; ++i) {
		var memRec = await memberGetByMidOne(allRec[i].mid);
		//console.log(memRec);
		allRec[i].name = getMemberName(memRec);
		await allRec[i].save();
	}
	sendok(res, allRec);
});


function sendok(res, usrmsg) { res.send(usrmsg); }
function senderr(res, errcode, errmsg) { res.status(errcode).send(errmsg); }
function setHeader(res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
}

module.exports = router;
