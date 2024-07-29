const { 
	encrypt, decrypt, dbencrypt, dbdecrypt, dbToSvrText, 
  svrToDbText, getMemberName, 
	sendCricMail, sendCricHtmlMail,
} = require('./functions'); 


var allMemberlist = [];
var allHodList = [];
var hodCityArray = []
let debugTest = true;



async function memberGetAll() {
	
	console.log(allMemberlist.length);
	if (allMemberlist.length === 0) {
		console.log("Reading member data from mongoose");
		allMemberlist = await M_Member.find({ceased: false}).sort({lastName: 1, firstName: 1, middleName: 1});
		//var tmp = allMemberlist.slice(0, 10);
		//for(var i=0; i<10; ++i) {
		//	console.log(allMemberlist[i].lastName, allMemberlist[i].middleName, allMemberlist[i].firstName);
		//}
		return _.cloneDeep(allMemberlist);
	}
	else {
		return _.cloneDeep(allMemberlist);
	}
}

// get list of members who are hod

async function memberGetHodMembers() {
	if (allMemberlist.length === 0) await memberGetAll();
	// Now get hod mid
	var hodList = await M_Hod.find({active: true}, {_id: 0, mid: 1});
	hodList = _.map(hodList, 'mid');
	var hodMembers = allMemberlist.filter( x => hodList.includes(x.mid) )
	return _.cloneDeep(hodMembers);
}

async function memberUpdateOne(memberRec) {
	if (allMemberlist.length === 0) await memberGetAll();
	var newList = allMemberlist.filter(x => x.mid !== memberRec.mid);
	if (!memberRec.ceased) 
		newList = newList.concat([memberRec])
	allMemberlist = _.sortBy(newList, [ 'lastName', 'middleName', 'firstName' ] );	
	await memberRec.save();
}

async function memberUpdateMany(memberRecArray) {
	if (allMemberlist.length === 0) await memberGetAll();
	var midList = _.map(memberRecArray, 'mid');
	var newList = allMemberlist.filter( x => !midList.includes(x.mid) );
	for(var i = 0; i < memberRecArray.length; ++i) {
		await memberRecArray[i].save();
		if (!memberRecArray[i].ceased)
			newList = newList.concat([memberRecArray[i]]);
	}
	allMemberlist = _.sortBy(newList, [ 'lastName', 'middleName', 'firstName' ] );	
}

async function memberAddOne(memberRec) {
	if (allMemberlist.length === 0) await memberGetAll();
	allMemberlist = _.sortBy(allMemberlist.concat([memberRec]), [ 'lastName', 'middleName', 'firstName' ] );	
	await memberRec.save();
}

async function memberAddMany(memberRecArray) {
	if (allMemberlist.length === 0) await memberGetAll();
	allMemberlist = _.sortBy(allMemberlist.concat(memberRecArray), [ 'lastName', 'middleName', 'firstName' ] );	
	for(var i=0; i<memberRecArray.length; ++i) {
		await memberRecArray[i].save();
	}
}

async function memberGetByMidOne(mid) {
	if (allMemberlist.length === 0) await memberGetAll();

	var memberRec = allMemberlist.find(x => x.mid === mid);
	return _.cloneDeep(memberRec);
}

async function memberGetByMobileOne(mobile) {
	if (allMemberlist.length === 0) await memberGetAll();
	//console.log(allMemberlist.length);
	//console.log(mobile);
	
	var memberRec = allMemberlist.find( x => (x.mobile === mobile) || (x.mobile1 === mobile)  );
	//console.log(memberRec);
	
	return _.cloneDeep(memberRec);
}

async function memberGetByEligibleMany(gender="all") {
	if (allMemberlist.length === 0) await memberGetAll();

	switch (gender.toLowerCase()) {
		case "female":  gender = "Female"; break;
		case "male":    gender = "Male"; break;
		default:				gender = "All"; break;
	};
	
	var validDate = new Date();
	validDate.setFullYear(validDate.getFullYear() - ELIGIBLEMARRIAGEYEARS);
	var validTime = validDate.getTime();
	
	console.log(allMemberlist.length);
	var myMembers = allMemberlist.filter(x => (x.emsStatus !== "") &&  (x.emsStatus !== "Married") ); 
	console.log(myMembers.length);
	
	if (gender !== "All") 
		myMembers = myMembers.filter(x => x.gender === gender);
	console.log(myMembers.length);

	myMembers = myMembers.filter(x => x.dob.getTime() <  validTime);
	console.log("Fileter over");
	
	return myMembers;
}



async function memberGetByEmailOne(email) {
	email = dbencrypt(email);
	if (allMemberlist.length === 0) await memberGetAll();
	
	var memberRec = allMemberlist.find( x => (x.email === email) || (x.email1 === email)  );
	//console.log(memberRec);
	
	return _.cloneDeep(memberRec);
}



async function memberGetByMidMany(midList) {
	if (allMemberlist.length === 0) await memberGetAll();

	var memberRecArray = allMemberlist.find(x => midList.includes(x.mid) );
	return _.cloneDeep(memberRecArray);
}


async function memberGetByHidMany(hid) {
	if (allMemberlist.length === 0) await memberGetAll();

	var memberRecArray = allMemberlist.filter(x => x.hid === hid);
	return _.cloneDeep(_.sortBy(memberRecArray, 'order'));
}

async function memberGetAlive() {
	if (allMemberlist.length === 0) await memberGetAll();

	var memberRecArray = allMemberlist.filter(x => !x.ceased);
	return _.cloneDeep(memberRecArray);	
}

async function readHodCityList() {
	console.log("Reading city list from database");
	let myData = await M_Hod.find({active: true, city: {"$ne": ""} },{hid: 1, city:1,_id:0}).sort({city: 1,});
	// Now get all the cities
	var allCity = _.map(myData, 'city');
	allCity = _.uniqBy(allCity);
	
	hodCityArray = [];
	for (var i=0; i<allCity.length; ++i) {
		var tmp = myData.filter(x => x.city === allCity[i]);
		hodCityArray.push({ city: allCity[i], hidList: _.map(tmp, 'hid') });
	}	
}

async function getHodCityList() {
	if (hodCityArray.length === 0) {
		await readHodCityList();
		return hodCityArray;
	}
	else {
		return hodCityArray;
	}
}

async function memberGetCount() {
	if (allMemberlist.length === 0) await memberGetAll();
	return allMemberlist.length;
}

async function memberGetAllHumad() {
	if (allMemberlist.length === 0) memberGetAll();
	return allMemberlist.filter(x => x.humadMember);
}

async function memberGetHumadCount() {
	if (allMemberlist.length === 0) memberGetAll();
	return allMemberlist.filter(x => x.humadMember).length;
}

async function memberGetAllPjym() {
	if (allMemberlist.length === 0) memberGetAll();
	return allMemberlist.filter(x => x.pjymMember);
}

async function memberGetPjymCount() {
	if (allMemberlist.length === 0) memberGetAll();
	return allMemberlist.filter(x => x.pjymMember).length;
}

module.exports = {
	memberGetAll, memberGetHodMembers,
	memberAddOne, memberAddMany,
	memberUpdateOne, memberUpdateMany,
	memberGetByMidOne, memberGetByMidMany, memberGetByMobileOne, memberGetByEmailOne,
	memberGetByHidMany, memberGetByEligibleMany,
	memberGetCount,
	memberGetAlive,
	memberGetAllHumad, memberGetHumadCount,
	memberGetAllPjym,
	getHodCityList, memberGetPjymCount,
}; 

