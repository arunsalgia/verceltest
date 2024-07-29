const {   
  encrypt, decrypt, dbencrypt, dbToSvrText, svrToDbText, dbdecrypt,
} = require('./functions'); 
const {
	memberGetAll, memberGetHodMembers,
	memberAddOne, memberAddMany,
	memberUpdateOne, memberUpdateMany,
	memberGetByMidOne, memberGetByMidMany, memberGetByEligibleMany,
	memberGetByHidMany,
	memberGetCount,
	memberGetAlive,
	getHodCityList,
	memberGetAllHumad, memberGetHumadCount, memberGetPjymCount,
	
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


router.get('/count/all/:mid', async function (req, res) {
  setHeader(res);
  var { mid } = req.params;
	
	var prwsCount = await memberGetCount();
  var pjymCount = await memberGetPjymCount();		// M_Pjym.countDocuments({active: true});
	var humadCount = await memberGetHumadCount();		//M_Humad.countDocuments({active: true});
	//console.log(Math.floor (Number(mid) / FAMILYMF));
	var familyRecs = await memberGetByHidMany(Math.floor (Number(mid) / FAMILYMF));
	//console.log(familyRecs);
	var familyCount = familyRecs.length;

	// first check if admin
	var adminRec = await M_Admin.findOne({mid: mid});
	var applCount = 0;	
	if (adminRec) {
		var ownerList = [];
		if (adminRec.prwsAdmin || adminRec.superAdmin)
			ownerList.push("PRWS");
		if (adminRec.pjymAdmin || adminRec.superAdmin)
			ownerList.push("PJYM");
		if (adminRec.humadAdmin || adminRec.superAdmin)
			ownerList.push("HUMAD");
		
		applCount += await M_Application.countDocuments({owner: {$in: ownerList }, status: APPLICATIONSTATUS.pending});
	}
	else {
		applCount = await M_Application.countDocuments({mid: mid, status: APPLICATIONSTATUS.pending});
	}
	
	var myData = {prws: prwsCount, pjym: pjymCount,  humad: humadCount,  family: familyCount, application:  applCount}; 
	//console.log(myData);
	sendok(res, myData);
});

router.get('/list/all', async function (req, res) {
  setHeader(res);
  var {fName, mName, lName } = req.params;
 
	let myData = await memberGetAll();
	var clonedArray = _.cloneDeep(myData);
	myData = clonedArray.filter(x => !x.ceased);
	for (var i=0; i< myData.length; ++i) { 
		var tmp = dbdecrypt(myData[i].email);
		if (myData[i].mid === 2001) console.log(tmp);
		tmp = encrypt(tmp);
		if (myData[i].mid === 2001) console.log(tmp);
		myData[i].email = tmp;		//dbToSvrText(myData[i].email);
		tmp = dbdecrypt(myData[i].email1);
		tmp = encrypt(tmp);
		myData[i].email1 = tmp;		//dbToSvrText(myData[i].email1);
	}
	sendok(res, myData);
});		

router.get('/mid/:mid', async function (req, res) {
  setHeader(res);
  var { mid  } = req.params;
 
	var clonedData = null;
	let myData = await memberGetByMidOne(Number(mid));
	if (myData) {
		clonedData = _.cloneDeep(myData);
		// encrypt email
		var tmp = dbdecrypt(clonedData.email);
		tmp = encrypt(tmp);
		clonedData.email = tmp;		//dbToSvrText(myData[i].email);
		// encrypt email1
		tmp = dbdecrypt(clonedData.email1);
		tmp = encrypt(tmp);
		clonedData.email1 = tmp;		//dbToSvrText(myData[i].email1);
	}
	sendok(res, clonedData);
});		

router.get('/filterdata/:filterInfo', async function (req, res) {
  setHeader(res);
  var {filterInfo } = req.params;
	filterInfo = JSON.parse(filterInfo);
	//console.log(filterInfo);

	let myData = await memberGetAll();
 	var clonedArray = _.cloneDeep(myData);
	myData = clonedArray.filter(x => !x.ceased);
	for (var i=0; i< filterInfo.filterData.length; ++i) {
		var fItem = filterInfo.filterData[i];
		switch (fItem.item) {
			case "FirstName": 
				myData = myData.filter(x => x.firstName.toUpperCase().includes(fItem.value.toUpperCase()) );
				break;
			case "MiddleName":
				myData = myData.filter(x => x.middleName.toUpperCase().includes(fItem.value.toUpperCase()) );
				break;
			case "LastName":
				myData = myData.filter(x => x.lastName.toUpperCase().includes(fItem.value.toUpperCase()) );
				break;
			case "Marital Status":
				if (fItem.value.toUpperCase() === "MARRIED")
					myData = myData.filter(x => !x.emsStatus.toUpperCase().includes("UNMARRIED"));
				else
					myData = myData.filter(x => x.emsStatus.toUpperCase().includes("UNMARRIED"));
				break;
			case "Gender":
				myData = myData.filter(x => x.gender.toUpperCase().startsWith(fItem.value.toUpperCase()) );
				break;
			case "Blood Group":
				myData = myData.filter(x => x.bloodGroup.toUpperCase().includes(fItem.value.toUpperCase()) );
				break;	
			case "City":
				console.log(fItem.value);
				var cityArray = await getHodCityList();
				var xxx = cityArray.find( x => x.city === fItem.value);
				//console.log(xxx);
				myData = myData.filter(x => xxx.hidList.includes(x.hid)  );
				break;	
			case "Age greater than":
			case "Age less than":
				// calculate dot based on age criteria
				var d = new Date();
				d.setFullYear(d.getFullYear() - fItem.value);
				// exclude all members whose dob is not available
				myData = myData.filter(x => x.dob.getFullYear() != 1900 );
				// now do the comparison
				if (fItem.item === "Age greater than")
					myData = myData.filter( x => x.dob.getTime() <= d.getTime() );
				else
					myData = myData.filter( x => x.dob.getTime() >= d.getTime() );
				break;
		}
	}
	
	var totalCount = myData.length;
	
	// If page number is -ve then full list is to be sent. Else give it only for page.
	if (filterInfo.pageNumber >= 0)
		myData = myData.slice(filterInfo.pageNumber* filterInfo.pageSize, (filterInfo.pageNumber+1)* filterInfo.pageSize);
	
	for (var i=0; i< myData.length; ++i) {
		var tmp = dbdecrypt(myData[i].email);
		tmp = encrypt(tmp);
		myData[i].email = tmp;		//dbToSvrText(myData[i].email);
		tmp = dbdecrypt(myData[i].email1);
		tmp = encrypt(tmp);
		myData[i].email1 = tmp;		//dbToSvrText(myData[i].email1);
	}
	//console.log(myData);
	
	sendok(res, {data: myData, count: totalCount} );
});		

router.get('/humadcount', async function (req, res) {
  setHeader(res);
  var myCount = await memberGetHumadCount();
	console.log("Humad count " + myCount);
	sendok(res, myCount.toString());
});		


router.get('/hod/all', async function (req, res) {
  setHeader(res);
  var {fName, mName, lName } = req.params;

	let myData = await memberGetHodMembers();
	var clonedArray = _.cloneDeep(myData);
	myData = clonedArray.filter(x => !x.ceased);
	for (var i=0; i< myData.length; ++i) {
		var tmp = dbdecrypt(myData[i].email);
		if (myData[i].mid === 2001) console.log(tmp);
		tmp = encrypt(tmp);
		if (myData[i].mid === 2001) console.log(tmp);
		myData[i].email = tmp;		//dbToSvrText(myData[i].email);
		tmp = dbdecrypt(myData[i].email1);
		tmp = encrypt(tmp);
		myData[i].email1 = tmp;		//dbToSvrText(myData[i].email1);
	}
	sendok(res, myData);
});		

router.get('/city/all', async function (req, res) {
  setHeader(res);
  var {fName, mName, lName } = req.params;

	/*console.log("getting list");
	let filterQuery;
	filterQuery = {};
	filterQuery["ceased"] = false;
	//console.log(filterQuery);*/
	
	let myData = await getHodCityList();
	sendok(res, myData);
});

router.get('/namelist/:fName/:mName/:lName', async function (req, res) {
  setHeader(res);
  var {fName, mName, lName } = req.params;

	var myData = await memberGetAll();
	if (fName !== "-") {
		myData = myData.filter(x => x.firstName.toLowerCase().includes(fName.toLowerCase()) );
	}
	if (mName !== "-") {
		myData = myData.filter(x => x.middleName.toLowerCase().includes(mName.toLowerCase()) );		
	}
	if (lName !== "-") {
		myData = myData.filter(x => x.lastName.toLowerCase().includes(lName.toLowerCase()) );				
	}
	sendok(res, myData);
});		


router.get('/namelist/all', async function (req, res) {
  setHeader(res);

	let myData = await memberGetAlive();
	//M_Member.find({ceased: false}, {hid: 1, mid: 1, title: 1, firstName: 1, middleName: 1, lastName: 1, alias: 1, dateOfMarriage: 1, _id: 0}).sort({lastName: 1, firstName: 1, middleName: 1});
	sendok(res, myData);
	
});		

router.get('/hod/:hid', async function (req, res) {
  setHeader(res);
  var { hid } = req.params;
	
	
	let myData = await memberGetByHidMany(Number(hid));
	myData = _.cloneDeep(myData);
	for(let i=0; i<myData.length; ++i) {
		myData[i].email = dbToSvrText(myData[i].email);
		myData[i].email1 = dbToSvrText(myData[i].email1);
	}
	sendok(res, myData);
});		

router.get('/eligible/:gender', async function (req, res) {
  setHeader(res);
  var { gender } = req.params;
	
	let myData = await memberGetByEligibleMany(gender);
	myData = _.cloneDeep(myData);
	for(let i=0; i<myData.length; ++i) {
		myData[i].email = dbToSvrText(myData[i].email);
		myData[i].email1 = dbToSvrText(myData[i].email1);
	}
	sendok(res, myData);
});	

router.post('/sethod/:mid', async function (req, res) {
  setHeader(res);
  var {mid } = req.params;
	mid = Number(mid);
	let hid = Math.trunc(mid / FAMILYMF);

	let hodRec = await M_Hod.findOne({hid: hid});
	hodRec.mid = mid;
	hodRec.save();
	
	//let myData = await M_Member.find({hid: hid, ceased: false}).sort({order: 1});
	let myData = _.cloneDeep(allMemberlist);
	myData = myData.filter(x => !x.ceased && x.hid == hid);
	myData[0].relation = "Relative";
	for(let i=0, startOrder=1; i<myData.length; ++i) {
		if (myData[i].mid === mid) {
			myData[i].order = 0;
			myData[i].relation = "Self";
		} else	{
			myData[i].order = startOrder++;
		}
		//myData[i].save();
		await updateMember(myData[i]);
	}
	sendok(res, "Done");
});	

router.post('/orgceased/:mid/:datestr', async function (req, res) {
  setHeader(res);
  var {mid, datestr } = req.params;
	mid = Number(mid);
	let hid = Math.trunc(mid / FAMILYMF);
	let d = new Date(
		Number(datestr.substr(0,4)), 
		Number(datestr.substr(4, 2))-1,
		Number(datestr.substr(6, 2)),
		0, 0, 0
	);
	
	
	// get all members of the family sorted by 'order'
	//let myData = await M_Member.find({hid: hid}).sort({order: 1});
	let myData = await memberGetByHidMany(hid);
	myData = _.sortBy(myData, 'order');
	
	// update ceased information in member
	let tmp = myData.find(x => x.mid === mid);
	tmp.ceased = true;
	tmp.ceasedDate = d;
	
	// update details of member's spouse
	tmp = myData.find(x => x.mid === tmp.spouseMid);
	if (tmp) {
		tmp.emsStatus = (myData.gender === "Male") ? "Widower" : "Widow";
		tmp.spouseMid = 0;
	}
	
	for(let i=0, startOrder=0; i<myData.length; ++i) {
		if (myData[i].mid !== mid) {
			myData[i].order = startOrder++;
		}
		//await myData[i].save();
	}
	await memberUpdateMany(myData);

	sendok(res, "Done");
});

router.get('/ceased/:ceasedInfo', async function (req, res) {
  setHeader(res);
  var {ceasedInfo} = req.params;
	
	ceasedInfo = JSON.parse(ceasedInfo);
	console.log(ceasedInfo);
	senderr(res, 601, "Done");
});


router.get('/split/:newFamilyData', async function (req, res) {
  setHeader(res);
  var {newFamilyData } = req.params;
	newFamilyData = JSON.parse(newFamilyData);
	let hid = Math.trunc(newFamilyData.hod / FAMILYMF);
	let tmpRec = await M_Hod.find({active: true}).limit(1).sort({hid: -1});
	let newHid = tmpRec[0].hid + 1;

	let hidRec = await M_Hod.findOne({hid: hid});
	
	let newRec = new M_Hod(_.omit(hidRec, '_id'));
	newRec.hid = newHid;
	newRec.mid = newRec.hid*FAMILYMF + 1;		// mid of HOD
	console.log(newRec);
	await newRec.save();

	let allMemRec = await M_Member.find({hid: hid, ceased: false});
	let newMid, newOrder, newRelation;

	// now rectify order number of members who are not getting transferred
	for (let i=0, orderNo=1; i<allMemRec.length; ++i) {
		if (!newFamilyData.memberList.includes(allMemRec[i].mid)) {
			console.log(allMemRec[i].mid);
			if (allMemRec[i].mid === hidRec.mid) {
				newOrder = 0;
			} else {
				newOrder = orderNo++
			}
			allMemRec[i].order = newOrder;
			allMemRec[i].save();
		}
	}
	
	// now transfer all selected members to new family
	for (let i=0, orderNo=1, seqNo=2; i<allMemRec.length; ++i) {
		if (newFamilyData.memberList.includes(allMemRec[i].mid)) {
			console.log(allMemRec[i].mid);
			if (allMemRec[i].mid === newFamilyData.hod) {
				newMid = newRec.hid*FAMILYMF + 1;
				newOrder = 0;
				newRelation = "Self";
			} else {
				newMid = newRec.hid*FAMILYMF + seqNo;
				seqNo++;
				newOrder = orderNo++
				newRelation = allMemRec[i].relation;
			}
			allMemRec[i].hid = newRec.hid
			allMemRec[i].mid = newMid;
			allMemRec[i].order = newOrder;
			allMemRec[i].relation = newRelation;
			allMemRec[i].save();
		}
	}

	sendok(res, "OK");
});	


router.post('/orgscrollup/:mid', async function (req, res) {
  setHeader(res);
  var {mid } = req.params;
	mid = Number(mid);
	let hid = Math.trunc(mid / FAMILYMF);

	//let myData = await M_Member.find({hid: hid, ceased: false}).sort({order: 1});
	let myData = _.cloneDeep(allMemberlist);
	myData = myData.filter(x => !x.ceased && x.hid === hid);
	
	myData[0].relation = "Relative";
	for(let i=0, startOrder=1; i<myData.length; ++i) {
		if (myData[i].mid !== mid) continue;
		--myData[i].order;
		++myData[i-1].order;		
		//myData[i-1].save();
		//myData[i].save();
		updateMember(myData[i-1]);
		updateMember(myData[i]);
		
	}
	sendok(res, "Done");
});	

router.get('/scrollup/:mid', async function (req, res) {
  setHeader(res);
  var {mid } = req.params;
	mid = Number(mid);
	let hid = Math.trunc(mid / FAMILYMF);

	//let myData = await M_Member.find({hid: hid, ceased: false}).sort({order: 1});
	//let myData = _.cloneDeep(allMemberlist);
	//myData = myData.filter(x => !x.ceased && x.hid === hid);
	myData = _.cloneDeep(await memberGetByHidMany(hid));
	
	var myIndex = myData.findIndex(x => x.mid === mid);
	console.log(myIndex);
	
	if (myIndex > 0) {
		// swap order with previous record
		var tmp = myData[myIndex].order;
		myData[myIndex].order = myData[myIndex-1].order;
		myData[myIndex-1].order = tmp;
		
		console.log(myData[myIndex-1].email, myData[myIndex].email);
		memberUpdateOne(myData[myIndex-1]);
		memberUpdateOne(myData[myIndex]);
		console.log(myData[myIndex-1].email, myData[myIndex].email);
		
		// send complete list after again sorting on order
		myData = _.cloneDeep(_.sortBy(myData, 'order'));
		console.log(myData[myIndex-1].email, myData[myIndex].email);
		for(var i=0; i<myData.length; ++i) {
			var tmp = dbdecrypt(myData[i].email);
			myData[i].email = encrypt(tmp);
			tmp = dbdecrypt(myData[i].email1);
			myData[i].email1 = encrypt(tmp);
		}
		console.log(myData[myIndex-1].email, myData[myIndex].email);

		return sendok(res, myData);
	}
	else {
		return senderr(res, 601, "Incorrect order");
	}
});	


router.post('/orgscrolldown/:mid', async function (req, res) {
  setHeader(res);
  var {mid } = req.params;
	mid = Number(mid);
	let hid = Math.trunc(mid / FAMILYMF);

	let myData = await M_Member.find({hid: hid, ceased: false}).sort({order: 1});
	myData[0].relation = "Relative";
	for(let i=0, startOrder=1; i<myData.length; ++i) {
		if (myData[i].mid !== mid) continue;
		++myData[i].order;
		--myData[i+1].order;		
		myData[i].save();
		myData[i+1].save();
	}
	sendok(res, "Done");
});	


router.get('/scrolldown/:mid', async function (req, res) {
  setHeader(res);
  var {mid } = req.params;
	mid = Number(mid);
	let hid = Math.trunc(mid / FAMILYMF);

	myData = _.cloneDeep(await memberGetByHidMany(hid));
	
	var myIndex = myData.findIndex(x => x.mid === mid);
	
	if ((myIndex > 0) && (myIndex < (myData.length -1)) )  {
		// swap order with previous record
		var tmp = myData[myIndex].order;
		myData[myIndex].order = myData[myIndex+1].order;
		myData[myIndex+1].order = tmp;
		
		memberUpdateOne(myData[myIndex+1]);
		memberUpdateOne(myData[myIndex]);
		// send complete list after again sorting on order
		myData = _.cloneDeep(_.sortBy(myData, 'order'));
		for(var i=0; i<myData.length; ++i) {
			var tmp = dbdecrypt(myData[i].email);
			myData[i].email = encrypt(tmp);
			tmp = dbdecrypt(myData[i].email1);
			myData[i].email1 = encrypt(tmp);
		}
		return sendok(res, myData);
	}
	else {
		return senderr(res, 601, "Incorrect order");
	}
});	

router.get('/test', async function (req, res) {
  setHeader(res);
  //var {cid, date, month, year } = req.params;
	let allMem = await M_Member.find({});
	let count = 0;
	for(i=0; i < allMem.length; ++i) {
		let tmp = allMem[i].dateOfMarriage.getFullYear();
		if ((tmp === 1970) || (tmp === 1970)) {
			allMem[i].dateOfMarriage = new Date(1900, 0, 1, 0, 0, 0);
			await allMem[i].save();
			++count;
		}
	}
	console.log(`Member count is ${count}`);
	sendok(res, "Done");
});

router.get('/getrelation', async function (req, res) {
  setHeader(res);
  //var {oldR, newR } = req.params;
	let allMem = await M_Member.distinct('relation');
	//var myList = _.map(
	
	sendok(res, allMem);
});
router.get('/changerelation/:oldR/:newR', async function (req, res) {
  setHeader(res);
  var {oldR, newR } = req.params;
	let allMem = await M_Member.find({relation: oldR});
	for(i=0; i < allMem.length; ++i) {
		let tmp = allMem[i].relation = newR
		await allMem[i].save();
	}
	sendok(res, "Done");
});		
 


function sendok(res, usrmsg) { res.send(usrmsg); }
function senderr(res, errcode, errmsg) { res.status(errcode).send(errmsg); }
function setHeader(res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
}

module.exports = router;
