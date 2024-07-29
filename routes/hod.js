var router = express.Router();
const { 
	ALPHABETSTR,
	getLoginName, getDisplayName,
	getMaster, setMaster,
	fetchPinDetails,
} = require('./functions'); 



router.use('/', function(req, res, next) {
  setHeader(res);
  if (!db_connection) { senderr(res, DBERROR,  ERR_NODB); return; }
 
  next('route');
});

// send list of in chunks of blocks.
// Each Block will contain #medicines which is confgired in MEDBLOCK

router.get('/get/:hid', async function(req, res, next) {
  setHeader(res);
  
  var {hid } = req.params;
	
	
  var tmp = await M_Hod.findOne({hid: Number(hid)});
	if (tmp)	sendok(res, tmp);
	else			senderr(res, 601, {hid: 0});
});

router.get('/getprevious/:hid', async function(req, res, next) {
  setHeader(res);
  
  var {hid } = req.params;
	hid = Number(hid);
	
	console.log("PREV HOD", hid);
  var tmp = await M_Hod.find({ hid: {$lt: hid} }).sort({hid: -1}).limit(1);
	if (tmp.length > 0) sendok(res, tmp[0]);
	else			senderr(res, 601, {hid: 0});
});


router.get('/getnext/:hid', async function(req, res, next) {
  setHeader(res);
  
  var {hid } = req.params;
	hid = Number(hid);
	
	console.log("NEXT HOD", hid);
  var tmp = await M_Hod.find({ hid: {$gt: hid} }).sort({hid: 1}).limit(1);
	if (tmp.length > 0) sendok(res, tmp[0]);
	else			senderr(res, 601, {hid: 0});
});


router.get('/hodname/:hid', async function(req, res, next) {
  setHeader(res);
  var {hid} = req.params;
	
	if (hid === 'all') {
		var tmp = await M_Hod.find({active: true});
		let midList = _.map(tmp, 'mid');
	
		let allHodNames = await M_Member.find({mid: {$in: midList}});
		allHodNames = _.map(allHodNames, o => _.pick(o, ['hid', 'mid', 'title', 'firstName', 'lastName', 'middleName', 'alias']));
		console.log(allHodNames);
		sendok(res, allHodNames);
	} 
	else {
		let memRec = await M_Member.findOne({hid: hid, order: 0});
		if (!memRec) return senderr(res, 601, 'Invalid HID');
		sendok(res, memRec);		
	}
});

router.get('/list', async function(req, res, next) {
  setHeader(res);
  
  var tmp = await M_Hod.find({active: true});
	sendok(res, tmp);
});


router.get('/mumbailist', async function(req, res, next) {
  setHeader(res);
	let myQuery = {active: true, $or: MUMBAIREGION };
	//console.log(myQuery);
  var tmp = await M_Hod.find(myQuery);
	sendok(res, tmp);
});

router.get('/pincode/:pinNumber', async function(req, res, next) {
  setHeader(res);
  
  var {pinNumber } = req.params;
	
	let myPinDetails = await fetchPinDetails(pinNumber);
	sendok(res, myPinDetails);
});

router.get('/testpin', async function(req, res, next) {
  setHeader(res);
	
	let myPinDetails = await PinCodeSchema.findOne({ pinCode: 400066 })
	sendok(res, myPinDetails);
});


router.get('/updatedetails/:hodData', async function(req, res, next) {
  setHeader(res);
  
  var {hodData} = req.params;

	
	hodData = JSON.parse(hodData);
	var hid = hodData.hid;

	console.log(hodData);
	return senderr(res, 601, "Not implemented");
	
	// first verify pin code 
	let pDetails = await fetchPinDetails(hodData.pinCode);
	//console.log(pDetails)
	if (!pDetails) return senderr(res, 602, "Invalid Pin code");

	let	mRec = await M_Hod.findOne({hid: hid});
	if (!mRec) return senderr(res, 601, "Invalid Hid");
	
	mRec.village			= hodData.village;

	mRec.addr1				= hodData.addr1;
	mRec.addr2				= hodData.addr2;
	mRec.addr3				= hodData.addr3;
	mRec.addr4				= hodData.addr4;
	mRec.addr5				= hodData.addr5;

	mRec.suburb				= hodData.suburb;
	mRec.city					= hodData.city;
	mRec.pinCode			= hodData.pinCode;

	mRec.resPhone1		= hodData.resPhone1;
	mRec.resPhone2		= hodData.resPhone2;

	// pin code details
	mRec.district 		= pDetails.District;
	mRec.division			= pDetails.Division;
	mRec.state 				= pDetails.State;

	mRec.save();
	//console.log(mRec);

	sendok(res, mRec);
});

router.get('/updategotra/:hodData', async function(req, res, next) {
  setHeader(res);
  
  var {hodData} = req.params;
	hodData = JSON.parse(hodData);
	var hid = hodData.hid;
	console.log(hodData);
	
	
	let	mRec = await M_Hod.findOne({hid: hid});
	if (!mRec) return senderr(res, 601, "Invalid Hid");
	
	mRec.gotra    = hodData.gotra;
	mRec.caste		= hodData.caste;
	mRec.subCaste	= hodData.subCaste;
	mRec.save();

	sendok(res, mRec);
});

router.get('/delete/:cid/:delNote', async function(req, res, next) {
  setHeader(res);
  
  var { cid, delNote } = req.params;
	
	let id = getLoginName(delNote);
	//console.log(id);
	
	M_Hod.deleteOne({cid: cid, id: id}).then(function(){
    //console.log("Data deleted"); // Success
		sendok(res, "1 note deleted");
	}).catch(function(error){
    console.log(error); // Failure
		senderr(res, 601, `Note not found in database.`);
	});
});

router.get('/list/:cid', async function(req, res, next) {
  setHeader(res);
  
  var { cid } = req.params;
	
	M_Hod.find({cid: cid}, {_id: 0, name: 1}, function(err, objs) {
		objs = _.sortBy(objs, 'name');
		sendok(res, objs);
  });
});

router.get('/gotra/list', async function(req, res, next) {
  setHeader(res);
  
	let gList = await M_Gotra.find({}, {_id: 0, name: 1}).sort({name: 1})
	sendok(res, gList);
});

router.get('/gotra/add/:newGotra', async function(req, res, next) {
  setHeader(res);
  
	var { newGotra } = req.params;

	let lGotra = getLoginName(newGotra);
	let dGotra = getDisplayName(newGotra);

	let gRec = await M_Gotra.findone({id: lGotra});
	if (!gRec) {
		gRec = new M_Gotra();
	}
	gRec.id = lGotra;
	gRec.name = dGotra;
	gRec.enabled = true;
	gRec.save();
	sendok(res, gRec);
});



function sendok(res, usrmsg) { res.send(usrmsg); }
function senderr(res, errcode, errmsg) { res.status(errcode).send(errmsg); }
function setHeader(res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
} 

module.exports = router;