var router = express.Router();
const {  
	getMemberName
} = require('./functions'); 
router.use('/', function(req, res, next) {
  setHeader(res);
  if (!db_connection) { senderr(res, DBERROR,  ERR_NODB); return; }
 
  next('route');
});

// send list of in chunks of blocks.
// Each Block will contain #medicines which is confgired in MEDBLOCK

router.get('/list', async function(req, res, next) {
  setHeader(res);

  var allAdmin = await M_Admin.find({});

	var allMids = _.map(allAdmin, 'mid');
	let myNames = await M_Member.find({mid: {$in: allMids}}, 
		{_id: 0, mid: 1, title: 1, firstName: 1, middleName: 1, lastName: 1});

	let result = [];
	for(let i=0; i<allAdmin.length; ++i) {
		tmp = myNames.find(x => x.mid === allAdmin[i].mid);
		result.push({
			mid: allAdmin[i].mid,
			title: tmp.title,
			name: getMemberName(tmp),
			superAdmin: allAdmin[i].superAdmin,
			pjymAdmin: allAdmin[i].pjymAdmin,
			humadAdmin: allAdmin[i].humadAdmin,
			prwsAdmin: allAdmin[i].prwsAdmin,
			pmmAdmin: allAdmin[i].prwsAdmin,
			superduper: allAdmin[i].superduper
		});
	}
	result = _.sortBy(result, 'name');
	sendok(res, result);
});


router.get('/add/:mid/:superA/:pjym/:humad/:prws/:pmm', async function(req, res, next) {
  setHeader(res);
  
  var { mid, superA, pjym, humad, prws, pmm } = req.params;
	mid = Number(mid);
	console.log(mid);

	let adminRec = await M_Admin.findOne({mid: mid});
	if (adminRec) return senderr(res, 601, "Duplicate entry");

	let memberRec = await M_Member.findOne({mid: mid});
	if (!memberRec) return senderr(res, 602, "Invalid Member Id");

  adminRec = new M_Admin();
	adminRec.mid = mid;
	adminRec.superAdmin = (superA == 'true');
	adminRec.humadAdmin = (humad == 'true');
	adminRec.pjymAdmin = (pjym == 'true');
	adminRec.prwsAdmin = (prws == 'true');
	adminRec.pmmAdmin = (pmm == 'true');
	adminRec.superduper = false;
	await adminRec.save();
 
	let result = {
		mid: adminRec.mid,
		title: memberRec.title,
		name: getMemberName(memberRec),
		superAdmin: adminRec.superAdmin,
		pjymAdmin: adminRec.pjymAdmin,
		humadAdmin: adminRec.humadAdmin,
		prwsAdmin: adminRec.prwsAdmin,
		pmmAdmin: adminRec.prwsAdmin,
		superduper: adminRec.superduper
	};

	sendok(res, result);
	
});

router.get('/update/:mid/:superA/:pjym/:humad/:prws/:pmm', async function(req, res, next) {
  setHeader(res);
  
  var { mid, superA, pjym, humad, prws, pmm } = req.params;
	mid = Number(mid);
	console.log(mid);

	let adminRec = await M_Admin.findOne({mid: mid});
	if (!adminRec) return senderr(res, 601, "entry not found");

	let memberRec = await M_Member.findOne({mid: mid});
	if (!memberRec) return senderr(res, 602, "Invalid Member Id");

	adminRec.superAdmin = (superA == 'true');
	adminRec.humadAdmin = (humad == 'true');
	adminRec.pjymAdmin = (pjym == 'true');
	adminRec.prwsAdmin = (prws == 'true');
	adminRec.pmmAdmin = (pmm == 'true');
	await adminRec.save();
 
	let result = {
		mid: adminRec.mid,
		title: memberRec.title,
		name: getMemberName(memberRec),
		superAdmin: adminRec.superAdmin,
		pjymAdmin: adminRec.pjymAdmin,
		humadAdmin: adminRec.humadAdmin,
		prwsAdmin: adminRec.prwsAdmin,
		pmmAdmin: adminRec.prwsAdmin,
		superduper: adminRec.superduper
	};

	sendok(res, result);
	
});


router.get('/delete/:mid', async function(req, res, next) {
  setHeader(res);
  
  var { mid } = req.params;
	mid = Number(mid);

	await M_Admin.deleteOne({mid: mid});
	sendok(res, "1 Admin deleted");
});


function sendok(res, usrmsg) { res.send(usrmsg); }
function senderr(res, errcode, errmsg) { res.status(errcode).send(errmsg); }
function setHeader(res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
} 

module.exports = router;