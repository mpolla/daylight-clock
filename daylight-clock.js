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
    return "" + Math.floor(hour) + ":" + zeroPad(Math.round(60 * (hour % 1)), 2);
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

// Draw clock
function draw() {
    
    //var d = new Date(2010, 5, 21, 4, 37, 33, 123);
    var d = new Date();
    
    var cNight = "rgba(0,0,90,1)";
    var cNightL = "rgba(40,40,120,1)";
    var cDay = "rgba(190,190,220,1)";
    var cDayL = "rgba(140,140,200,1)";
    var cText = "rgba(100,100,100,0.9)";

    var canvas = document.getElementById("daylightometer");
    var ctx = canvas.getContext("2d");
    
    ctx.canvas.width  = window.innerWidth - 20;
    ctx.canvas.height = window.innerHeight -10;
    
    var w = Math.min(ctx.canvas.width, ctx.canvas.height);
    var h = Math.min(ctx.canvas.width, ctx.canvas.height);
    var h = w*1.1;

    var fontsize = 0.02*w;
    var cx = w/2;
    var cy = h*0.5;
    var rad = w*0.27;
    var trad = rad*1.1;
    var offset = -d.getTimezoneOffset() / 60;
    
    //var myLocation = new SunriseSunset( 2011, 0, 9, 67.8, 27);

    var polar_latitude = 66;

    var longitude = parseFloat(http_param('lon'));
    var latitude = parseFloat(http_param('lat'));
    var location_name = '';
    
    // Check for lat/long coordinates in URL parameters
    if (! http_param('lat') && ! http_param('long')) {
	latitude = geoip_latitude();
	longitude = geoip_longitude();
	location_name = geoip_city() + "/" + geoip_country_name();
    }
    else {
	location_name = latitude + "° lat, " + longitude + "° lon";    
    }

    var myLocation = new SunriseSunset( d.getFullYear(), d.getMonth()+1, d.getDate()+1, latitude, longitude);
    
    var riseHour = myLocation.sunriseLocalHours(offset);
    var setHour = myLocation.sunsetLocalHours(offset);
    
    // Solstice workaround
    if (isNaN(riseHour))
	riseHour = 0.00;
    if (isNaN(setHour))
	setHour = 0.00;
    
    var dayLen = hourstr(setHour - riseHour);
    var nightLen = hourstr(24.0 - (setHour - riseHour));

    ctx.font = "" + Math.floor(0.05*h) + "pt Arial";
    ctx.lineWidth = w*0.018;
    
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
    ctx.font = w*0.02 + "pt Arial";
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
	var tmpy = cy + trad * Math.sin(hour2rad(i, mode)) + w*0.01;
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
	// 12 hour display, ante meridiem
	
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
	    drawSector( cx, cy, cDay, rad, hour2rad(setHour, mode), hour2rad(riseHour, mode));
	    drawSector( cx, cy, cNight, rad, hour2rad(riseHour, mode), hour2rad(setHour, mode));
	    drawSector( cx, cy, cNight, rad*0.9, hour2rad(riseHour, mode), hour2rad(0, mode));
	    drawSector( cx, cy, cNight, rad*0.9, hour2rad(0, mode), hour2rad(setHour, mode));
	}
	// Sun up
	else {
	    
	    if ((setHour - riseHour) < 12) {
		drawSector( cx, cy, cNight, rad, 0, 2*Math.PI);
		drawSector( cx, cy, cNight, rad*0.9, 0, 2*Math.PI);
		drawSector( cx, cy, cDay, rad*0.9, hour2rad(hourNow, mode), hour2rad(riseHour, mode));
		drawSector( cx, cy, cDay, rad*0.9, hour2rad(setHour, mode), hour2rad(hourNow, mode));
	    }
	    else {
		drawSector( cx, cy, cNight, rad, hour2rad(riseHour,mode), hour2rad(setHour,mode));
		drawSector( cx, cy, cDay, rad, hour2rad(setHour,mode), hour2rad(riseHour,mode));
		drawSector( cx, cy, cDay, rad*0.9, 0, 2*Math.PI);
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
	tmpRad = - Math.PI + hour2rad(0.5*(setHour+riseHour), mode);
	if (hourNow < setHour)
	    tmpRad += Math.PI;
    }
    else
	tmpRad = 0.5 * (hour2rad(setHour, mode) + hour2rad(riseHour, mode));
    
    var dlx = cx + (trad *.5) * Math.cos(tmpRad);
    var dly = cy + (trad *.5) * Math.sin(tmpRad);
    var nlx = cx + (trad *.5) * Math.cos(tmpRad + Math.PI);
    var nly = cy + (trad *.5) * Math.sin(tmpRad + Math.PI);
    
    ctx.textAlign = "center";
    // display day length if sun is up and night is long
    if ( mode == 12 && (hourNow < riseHour || hourNow > setHour) && (24-setHour+riseHour)>12) {}
    else {
	ctx.fillStyle = cNightL;
	ctx.font = "bold "+w*0.02+"pt Arial";
	ctx.fillText("day length", dlx, dly-w*0.02);
	ctx.fillText(dayLen, dlx, dly+w*0.02);
    }
    if ( mode == 12 && (hourNow > riseHour && hourNow < setHour) && (setHour-riseHour)>12 ) {}
    else {
	ctx.fillStyle = cDayL;
	ctx.font = "bold "+w*0.02+"pt Arial";
	ctx.fillText("night length", nlx, nly-w*0.02);
	ctx.fillText(nightLen, nlx, nly+w*0.02);
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
    ctx.font = w*0.016 + "pt Arial";
    ctx.fillText(time, 0.03*w, 0.04*h);
    ctx.font = "bold " + Math.floor(0.04*w) + "pt Arial";
    ctx.fillText(title, 0.03*w, 0.11*h);
    
    if (! (riseHour == 0 && setHour == 0)) {
	ctx.textAlign = "center";
	
	if (riseHour < hourNow && hourNow < setHour)
	    ctx.font = "bold " + fontsize + "pt Arial";
	else
	    ctx.font = fontsize + "pt Arial";
	
	
	ctx.fillText("sunset", 
		     cx+(rad*1.35)*Math.cos(hour2rad(setHour,mode)), 
		     cy+(rad*1.35)*Math.sin(hour2rad(setHour,mode)));
	ctx.fillText("at " + hourstr(setHour), 
		     cx+(rad*1.35)*Math.cos(hour2rad(setHour,mode)), 
		     w*0.03+cy+(rad*1.35)*Math.sin(hour2rad(setHour,mode)));
	
	
	if (hourNow < riseHour || hourNow > setHour)
	    ctx.font = "bold " + fontsize + "pt Arial";
	else
	    ctx.font = fontsize + "pt Arial";
	
	ctx.fillText("sunrise", 
		     cx+(rad*1.35)*Math.cos(hour2rad(riseHour,mode)), 
		     cy+(rad*1.35)*Math.sin(hour2rad(riseHour,mode)));
	ctx.fillText("at " + hourstr(riseHour), 
		     cx+(rad*1.35)*Math.cos(hour2rad(riseHour,mode)), 
		     w*0.03+cy+(rad*1.35)*Math.sin(hour2rad(riseHour,mode)));
    }
}

