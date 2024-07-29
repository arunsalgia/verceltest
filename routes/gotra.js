var router = express.Router();
const { 
	getLoginName, getDisplayName,
} = require('./functions'); 

async function updateGotraInHod(oldGotra, newGotra) {
	let allHods = await M_Hod.find({active: true, gotra: oldGotra}); 
	for(let i=0; i<allHods.length; ++i) {
		//console.log(allHods[i].hid, allHods[i].gotra);
		allHods[i].gotra = newGotra;
		await allHods[i].save();
	}
}


router.use('/', function(req, res, next) {
  setHeader(res);
  if (!db_connection) { senderr(res, DBERROR,  ERR_NODB); return; }
 
  next('route');
});

// send list of in chunks of blocks.
// Each Block will contain #medicines which is confgired in MEDBLOCK

router.get('/list', async function(req, res, next) {
  setHeader(res);

  var tmp = await M_Gotra.find({}, {_id: 0, gotra: 1}).sort({gotra: 1});
	sendok(res, tmp);
});

router.get('/listfromhod', async function(req, res, next) {
  setHeader(res);

  var tmp = await M_Hod.find({active: true, gotra: {$ne: ''} }, {_id: 0, gotra: 1}).sort({gotra: 1}).sort({gotra: 1});
	tmp = _.uniqBy(tmp, 'gotra');
	sendok(res, tmp);
});


router.get('/add/:newGotra', async function(req, res, next) {
  setHeader(res);
  
  var {newGotra} = req.params;
	console.log(newGotra);
	let lname = getDisplayName(newGotra);	
	M_Gotra.findOne({id: lname}, async function (err, rec) {
    if (err == null) {
			// good it is not found
			let mRec = new M_Gotra();
			mRec.id = lname;
			mRec.gotra = lname;
			mRec.enabled = true;
			await mRec.save();
			sendok(res, mRec);
		} else {
			console.log(err);
      console.log("Data found");
			senderr(res, 601, "Gotra already in database");
    }
	});
	
});

router.get('/renametonew/:oldGotra/:newGotra', async function(req, res, next) {
  setHeader(res);
  
  var {oldGotra, newGotra} = req.params;
	console.log(oldGotra, newGotra);

	let tmp = await M_Gotra.findOne({id: getDisplayName(newGotra)});
	if (tmp) return senderr(res, 601, "new found");
	
	let rec1 = await M_Gotra.findOne({id: getDisplayName(oldGotra)});
	if (!rec1)  return senderr(res, 602, "old not found");

	rec1.id = getDisplayName(newGotra);
	rec1.gotra = getDisplayName(newGotra);
	rec1.enabled = true;
	await updateGotraInHod(getDisplayName(oldGotra), getDisplayName(newGotra))
	await rec1.save();
	sendok(res, rec1);

});

router.get('/renametoexisting/:oldGotra/:newGotra', async function(req, res, next) {
  setHeader(res);
  
  var {oldGotra, newGotra} = req.params;

	let tmp = await M_Gotra.findOne({id: getDisplayName(oldGotra)})
	if (!tmp) return senderr(res, 602, "Old Gotra not found in database");

	let mRec = await M_Gotra.findOne({id: getDisplayName(newGotra)})
	if (!mRec) return senderr(res, 601, "New Gotra not found in database");

	// now rename in HOD
	await updateGotraInHod(getDisplayName(oldGotra), getDisplayName(newGotra))

	// just delete the old one
	await M_Gotra.deleteOne({id: getDisplayName(oldGotra)});

	sendok(res, mRec);
});

router.get('/delete/:delGotra', async function(req, res, next) {
  setHeader(res);
  
  var { delGotra } = req.params;
	
	//console.log("In delete...........................");
	let dName = getDisplayName(delGotra);
	console.log(dName);
	// confirm if HOS is not using this gotra
	let temp = await M_Hod.find({active: true, gotra: dName});
	if (temp.length > 0) return senderr(res, 601, "In use");

	console.log("this gotra is not in use");
	await M_Gotra.deleteOne({gotra: dName});
	console.log("Deleted....");
	sendok(res, "1 gotra deleted");
});


router.get('/test', async function(req, res, next) {
  setHeader(res);
	
	var allRec = await M_Gotra.find({});
	for (var i=0; i<allRec.length; ++i) {
		allRec[i].id = getDisplayName(allRec[i].id);
		allRec[i].gotra = getDisplayName(allRec[i].id);
		await allRec[i].save();
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