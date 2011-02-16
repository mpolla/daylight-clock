// daylight-clock - sunrise/sunset clock on HTML5 canvas
//
// https://github.com/mpolla/daylight-clock
//
// Copyright (c) 2011 Matti Pöllä
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var mode = 12;
var latitude;
var longitude;
var location_name;
var myLocation;
var riseHour;
var setHour;
var hourNow;
var d;
var offset;

// Transform floating point hours (0.00 ... 23.99)
// into radians (-PI/4 ... + 3*PI/4)
function hour2rad(hour, mode) {
    if (mode == 12) {
	if (12 <= hour)
	    hour = hour - 12;
	return -Math.PI/2 + (hour/12.0)*Math.PI*2;
    }
    return -Math.PI/2 + (hour/24.0)*Math.PI*2;
}

// 12 hour format
function dom12h() {
    init();
    return draw();
}

// 24 hour format
function dom24h() {
    mode = 24;
    init();
    return draw();
}

function init() {
    //d = new Date(2010, 5, 21, 4, 37, 33, 123);
    d = new Date();

    longitude = parseFloat(http_param('lon'));
    latitude = parseFloat(http_param('lat'));
    location_name = '';
 
    offset = -d.getTimezoneOffset() / 60;

    // Check for lat/long coordinates in URL parameters
    if (! http_param('lat') && ! http_param('long')) {
	geoIP();
    }
    else
	location_name = coordstr(latitude,longitude);

    myLocation = new SunriseSunset( d.getFullYear(), 
					d.getMonth()+1, 
					d.getDate()+1, 
					latitude, 
					longitude);
    
    riseHour = myLocation.sunriseLocalHours(offset);
    setHour = myLocation.sunsetLocalHours(offset);

    geoIP();
    setInterval("draw();", 1000);
}

// Left zero-pad numbers
function zeroPad( number, width) {
    width -= number.toString().length;
    if ( width > 0 )
	return new Array(width + (/\./.test( number ) ? 2 : 1)).join('0') + number;
    return number;
}

// Transform floating point value into hour representation
// e.g. 16.82 --> "16:49"
function hourstr(hour) {
    return "" + Math.floor(hour) + ":" + 
	zeroPad(Math.round(60 * (hour % 1)), 2);
}

// Draw sector
function drawSector(cx, cy, color, radius, start, stop) {

    var canvas = document.getElementById("daylightometer");
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, stop, true);
    ctx.closePath();
    ctx.fill(); 
}

function timeremaining(time) {
    var hours = Math.floor(time);
    var mins = Math.floor((time-hours)*60);
    var secs = Math.floor(3600*(time-hours-mins/60));
    
    //return hours + ":" + mins + ":" + secs;
    if (hours >= 2)
	return Math.round(time) + " hours";
    else if (hours >= 1)
	return "one hour and " + mins + " minutes";
    else if (mins > 5)
	return mins + " minutes";
    else if (mins >= 1)
	return mins + " minutes and " + secs + " seconds";
    else
	return secs + " seconds";
}

// Adapted from 
// http://www.netlobo.com/url_query_string_javascript.html
function http_param( param) {
    param = param.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]" + param + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
	return "";
    else
	return results[1];
}

function coordstr(lat,lon) {
    var latstr = "N";
    var lonstr = "W";

    if (lat < 0) {
	lat = -lat;
	latstr = "S";
    }

    if (lon > 180) {
	lon -= 180;
	lonstr = "E";
    }

    if (lon < 0) {
	lon = -lon;
	lonstr = "E";
    }

    return lat.toPrecision(4) + "° " + latstr + ", " + lon.toPrecision(4) + "° " + lonstr;
}



function dayLength(date, riseHour, setHour) {
    return setHour - riseHour;
}

function nightLength(date, riseHour, setHour) {
    return 24.0 - dayLength(date, riseHour, setHour);
}

function sunUp(hourNow, riseHour, setHour) {
    if (hourNow < riseHour || hourNow > setHour)
	return false;
    return true
}

function sunDown(hourNow, riseHour, setHour) {
    if (sunUp(hourNow, riseHour, setHour))
	return false;
    return true;
}

function geoIP() {
    
    try {
	latitude = geoip_latitude();
	longitude = geoip_longitude();
	location_name = geoip_city() + "/" + geoip_country_name();
    }
    catch (exception) {
	longitude = 0;
	latitude = 0;
	location_name = "Unknown location";
    }
}

// Draw clock
function draw() {
    
    var cNight = "rgba(0,0,90,1)";
    var cNightL = "rgba(40,40,120,1)";
    var cDay = "rgba(190,190,220,1)";
    var cDayL = "rgba(140,140,200,1)";
    var cText = "rgba(100,100,100,0.9)";

    var canvas = document.getElementById("daylightometer");
    var ctx = canvas.getContext("2d");
    
    ctx.canvas.width  = window.innerWidth - 20;
    ctx.canvas.height = window.innerHeight -10;
    
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    // Layout scaling
    var scale = 0.8*Math.min(w,h) + 0.2*Math.max(w,h);
    var fontsize = 0.02 * scale;
    var fontsize_title = 0.03 * scale;
    var fontsize_time = 0.018 * scale;
    var cx = .5 * w;
    var cy = .56 * h;
    var rad = 0.28 * scale;
    var trad = 1.15 * rad;
    var rad_label = 1.4 * rad;

    //var myLocation = new SunriseSunset( 2011, 0, 9, 67.8, 27);

    var polar_latitude = 66;

    
    // Solstice workaround
    if (isNaN(riseHour))
	riseHour = 0.00;
    if (isNaN(setHour))
	setHour = 0.00;
    
    var dayLen = hourstr(setHour - riseHour);
    var nightLen = hourstr(24.0 - (setHour - riseHour));

    ctx.font = "" + Math.floor(0.05*h) + "pt Arial";
    ctx.lineWidth = scale*0.018;
    
    // background
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, w, h);
    
    // current time in decimal hours (0.00 ... 23.99)
    if (! http_param('lat') && !http_param('lon'))
	hourNow = d.getHours() + d.getMinutes()/60 + d.getSeconds()/3600;
    else
	hourNow = d.getUTCHours() + d.getUTCMinutes()/60 + d.getUTCSeconds()/3600;

    // Print hour tics
    ctx.fillStyle = cText;
    ctx.font = scale*0.02 + "pt Arial";
    ctx.textAlign = "center";
    var start = 1;
    var end = 24;
    if (mode == 12) {
	if (d.getHours() > 12)
	    start += 12;
	else
	    end /= 2;
    }
    for (i=start; i<=end; i++) {
	var tmpx = cx + trad * Math.cos(hour2rad(i, mode));
	var tmpy = cy + trad * Math.sin(hour2rad(i, mode)) + scale*0.01;
	if (i%3==0)
	    ctx.fillText(i, tmpx, tmpy);
	
	// Hour tics
	ctx.beginPath();   
	ctx.moveTo(cx + (rad*1.03) * Math.cos(hour2rad(i, mode)),
		   cy + (rad*1.03) * Math.sin(hour2rad(i, mode)));
	ctx.lineTo(cx + rad * Math.cos(hour2rad(i, mode)), cy + rad * Math.sin(hour2rad(i, mode)));
	ctx.strokeStyle = "rgba(130,130,130,0.7)";
	ctx.stroke();
	ctx.closePath();
    }
    
    
    if (mode == 12) {
	// Polar night (kaamos)
	if (riseHour == 0 && setHour == 0 && latitude > polar_latitude) {
	    drawSector( cx, cy, cNight, rad, 0, 2*Math.PI);
	}
	// Midnight sun (yötön yö)
	else if (riseHour == 0 && setHour == 0 && latitude < -polar_latitude) {
	    drawSector( cx, cy, cDay, rad, 0, 2*Math.PI);
	}
	
	// Sun down
	else if ((hourNow < riseHour) || (hourNow > setHour)) {

	    if ((setHour - riseHour) > 12) {
		drawSector( cx, cy, cDay, rad, 0, 2*Math.PI); // day around the clock coming
		drawSector( cx, cy, cNight, rad*0.9, hour2rad(riseHour, mode), hour2rad(setHour, mode));
	    }
	    else {
		drawSector( cx, cy, cNight, rad, hour2rad(riseHour, mode), hour2rad(setHour, mode));
		drawSector( cx, cy, cDay, rad, hour2rad(setHour, mode), hour2rad(riseHour, mode));
		drawSector( cx, cy, cNight, rad*0.9, 0, 2*Math.PI); // night around the clock now
	    }

	}
	// Sun up
	else {
	    
	    if ((setHour - riseHour) < 12) {
		drawSector( cx, cy, cNight, rad, 0, 2*Math.PI); // night around the clock coming
		drawSector( cx, cy, cNight, rad*0.9, 0, 2*Math.PI);
		drawSector( cx, cy, cDay, rad*0.9, hour2rad(hourNow, mode), hour2rad(riseHour, mode));
		drawSector( cx, cy, cDay, rad*0.9, hour2rad(setHour, mode), hour2rad(hourNow, mode));
	    }
	    else {
		drawSector( cx, cy, cNight, rad, hour2rad(riseHour,mode), hour2rad(setHour,mode));
		drawSector( cx, cy, cDay, rad, hour2rad(setHour,mode), hour2rad(riseHour,mode));
		drawSector( cx, cy, cDay, rad*0.9, 0, 2*Math.PI); // day around the clock now
	    }
	}
	
    }
    // 24 hour display
    else {
	drawSector( cx, cy, cNight, rad, hour2rad(riseHour, mode), hour2rad(setHour, mode));
	drawSector( cx, cy, cDay, rad, hour2rad(setHour, mode), hour2rad(riseHour, mode));
    }
    
    // Clock hand
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + .97*rad * Math.cos(hour2rad(hourNow, mode)), 
	       cy + .97*rad * Math.sin(hour2rad(hourNow, mode)));
    ctx.strokeStyle = "rgba(255,120,60,0.8)";
    ctx.stroke();
    ctx.closePath();
    
    // Print day and night length
    var tmprad;
    if (mode == 12) {
	tmpRad = hour2rad(riseHour + 0.5*(setHour-riseHour),mode);
	if (hourNow < riseHour || hourNow > setHour)
	    tmpRad += Math.PI;
    }
    else
	tmpRad = 0.5 * (hour2rad(setHour, mode) + hour2rad(riseHour, mode));
    
    var dlx = cx + (trad *.5) * Math.cos(tmpRad);
    var dly = cy + (trad *.5) * Math.sin(tmpRad);
    var nlx = cx + (trad *.5) * Math.cos(tmpRad + Math.PI);
    var nly = cy + (trad *.5) * Math.sin(tmpRad + Math.PI);
    
    ctx.textAlign = "center";

    if ( mode == 12 && (hourNow < riseHour || hourNow > setHour) && (24-setHour+riseHour)>12) {}
    // hide day length only if sun down and night runs around the clock
    else {
	ctx.fillStyle = cNightL;
	ctx.font = "bold "+scale*0.02+"pt Arial";
	ctx.fillText("day length", dlx, dly-scale*0.02);
	ctx.fillText(dayLen, dlx, dly+scale*0.02);
    }
    if ( mode == 12 && (hourNow > riseHour && hourNow < setHour) && (setHour-riseHour)>12 ) {}
    // hide night length only if sun up and day runs around the clock
    else {
	ctx.fillStyle = cDayL;
	ctx.font = "bold "+scale*0.02+"pt Arial";
	ctx.fillText("night length", nlx, nly-scale*0.02);
	ctx.fillText(nightLen, nlx, nly+scale*0.02);
    }
    
    // Show sunrise/sunset ticker	
    ctx.textAlign = "left";
    
    var time;
    var title;
    if (! http_param('lat'))
	time = location_name + " " + d.toTimeString();
    else
	time = location_name + " " + d.toUTCString();
    
    if (riseHour == 0 && setHour == 0 && latitude > polar_latitude)
	title = "polar night";
    else if (riseHour == 0 && setHour == 0 && latitude < -polar_latitude)
	title = "midnight sun";
    else if (hourNow < riseHour)
	title = "sunrise in " + timeremaining(riseHour-hourNow);
    else if (hourNow < setHour)
	title = "sunset in " + timeremaining(setHour-hourNow);
    else if (hourNow > setHour)
	title = "sunrise in " + timeremaining(riseHour+(24-hourNow));

    ctx.fillStyle = "rgba(80,80,80,0.7)";
    ctx.font = fontsize_time + "pt Arial";
    ctx.fillText(time, 0.03*w, 0.04*h);
    ctx.font = "bold " + Math.floor(0.04*scale) + "pt Arial";
    ctx.fillText(title, 0.03*w, 0.11*h);

    // Print sunrise/sunset time labels
    if (riseHour == 0 && setHour == 0) {}
    else {
	ctx.textAlign = "center";
	
	if (riseHour < hourNow && hourNow < setHour)
	    ctx.font = "bold " + fontsize + "pt Arial";
	else
	    ctx.font = fontsize + "pt Arial";
	
	ctx.fillText("sunset", 
		     cx+rad_label*Math.cos(hour2rad(setHour,mode)), 
		     cy+rad_label*Math.sin(hour2rad(setHour,mode)));
	ctx.fillText("at " + hourstr(setHour), 
		     cx+rad_label*Math.cos(hour2rad(setHour,mode)), 
		     scale*0.03+cy+rad_label*Math.sin(hour2rad(setHour,mode)));
	
	
	if (hourNow < riseHour || hourNow > setHour)
	    ctx.font = "bold " + fontsize + "pt Arial";
	else
	    ctx.font = fontsize + "pt Arial";
	
	ctx.fillText("sunrise", 
		     cx+rad_label*Math.cos(hour2rad(riseHour,mode)), 
		     cy+rad_label*Math.sin(hour2rad(riseHour,mode)));
	ctx.fillText("at " + hourstr(riseHour), 
		     cx+rad_label*Math.cos(hour2rad(riseHour,mode)), 
		     scale*0.03+cy+rad_label*Math.sin(hour2rad(riseHour,mode)));
    }
}
