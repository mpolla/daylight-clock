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

var dc = new DaylightClock();

// 12 hour format
function dom12h() {
    dc.setMode(12);
    dc.init()
    setInterval("dc.update()", 1000);
}

// 24 hour format
function dom24h() {
    dc.setMode(24);
    dc.init();
    setInterval("dc.update()", 1000);
}

// Left zero-pad numbers
function zeroPad( number, width) {
    width -= number.toString().length;
    if ( width > 0 )
	return new Array(width + (/\./.test( number ) ? 2 : 1)).join('0') + number;
    return number;
}


function DaylightClock() {
    
    this.mode = 12;
    this.latitude;
    this.longitude;
    this.location_name;
    this.riseHour;
    this.setHour;
    this.hourNow;
    this.d;
    this.offset;
    this.sunriseSunset;
    
    this.canvas;// = document.getElementById("daylightometer");
    this.ctx; //= canvas.getContext("2d");

    this.setMode = function(newmode) {
	this.mode = newmode;
    }

    // Transform floating point hours (0.00 ... 23.99)
    // into radians (-PI/4 ... + 3*PI/4)
    this.hour2rad = function (hour) {
	if (this.mode == 12) {
	    if (12 <= hour)
		hour = hour - 12;
	    return -Math.PI/2 + (hour/12.0)*Math.PI*2;
	}
	return -Math.PI/2 + (hour/24.0)*Math.PI*2;
    }
    
    this.init = function() {
	//d = new Date(2010, 5, 21, 4, 37, 33, 123);
	this.d = new Date();
	this.offset = -this.d.getTimezoneOffset() / 60;

	this.location_name = '';
	this.longitude = parseFloat(this.http_param('lon'));
	this.latitude = parseFloat(this.http_param('lat'));
	// Check for lat/long coordinates in URL parameters
	if (! this.http_param('lat') && ! this.http_param('long'))
	    this.geoIP();
	else
	    this.location_name = this.coordstr(latitude,longitude);
	
	this.canvas = document.getElementById("daylightometer");
	this.ctx = this.canvas.getContext("2d");
	this.update();
    }
    
    this.update = function() {

	this.d = new Date();
	this.sunriseSunset = new SunriseSunset( this.d.getFullYear(), 
						 this.d.getMonth()+1, 
						 this.d.getDate()+1, 
						 this.latitude, 
						 this.longitude);
	
	this.riseHour = this.sunriseSunset.sunriseLocalHours(this.offset);
	this.setHour = this.sunriseSunset.sunsetLocalHours(this.offset);	
	this.draw()
    }

    
    // Transform floating point value into hour representation
    // e.g. 16.82 --> "16:49"
    this.hourstr = function(hour) {
	return "" + Math.floor(hour) + ":" + 
	    zeroPad(Math.round(60 * (hour % 1)), 2);
    }
    
    // Draw sector
    this.drawSector = function(cx, cy, color, radius, start, stop) {
	
	this.ctx.fillStyle = color;
	this.ctx.beginPath();
	this.ctx.moveTo(cx, cy);
	this.ctx.arc(cx, cy, radius, start, stop, true);
	this.ctx.closePath();
	this.ctx.fill(); 
    }
    
    this.timeremaining = function(time) {
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
    this.http_param = function( param) {
	param = param.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]" + param + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.href);
	if (results == null)
	    return "";
	else
	    return results[1];
    }
    
    this.coordstr = function(lat,lon) {
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
    
    
    
    this.dayLength = function() {
	return this.setHour - this.riseHour;
    }
    
    this.nightLength = function() {
	return 24.0 - this.dayLength();
    }

    /*
    function sunUp(hourNow, riseHour, setHour) {
	if (hourNow < riseHour || hourNow > setHour)
	    return false;
	return true;
    }
    
    function sunDown(hourNow, riseHour, setHour) {
	if (sunUp(hourNow, riseHour, setHour))
	    return false;
	return true;
    }
    */

    this.geoIP = function() {
	
	try {
	    this.latitude = geoip_latitude();
	    this.longitude = geoip_longitude();
	    this.location_name = geoip_city() + "/" + geoip_country_name();
	}
	catch (exception) {
	    this.longitude = 0;
	    this.latitude = 0;
	    this.location_name = "Unknown location";
	}
    }
    
    // Draw clock
    this.draw = function() {
	
	this.d = new Date();
	
	var cNight = "rgba(0,0,90,1)";
	var cNightL = "rgba(40,40,120,1)";
	var cDay = "rgba(190,190,220,1)";
	var cDayL = "rgba(140,140,200,1)";
	var cText = "rgba(100,100,100,0.9)";
	
	this.ctx.canvas.width  = window.innerWidth - 20;
	this.ctx.canvas.height = window.innerHeight -10;
	
	var w = this.ctx.canvas.width;
	var h = this.ctx.canvas.height;
	
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
	var polar_latitude = 66;
	
	// Solstice workaround
	if (isNaN(this.riseHour))
	    this.riseHour = 0.00;
	if (isNaN(this.setHour))
	    this.setHour = 0.00;
	
	var dayLen = this.hourstr(this.setHour - this.riseHour);
	var nightLen = this.hourstr(24.0 - (this.setHour - this.riseHour));
	
	this.ctx.font = "" + Math.floor(0.05*h) + "pt Arial";
	this.ctx.lineWidth = scale*0.018;
	
	// background
	this.ctx.fillStyle = "rgb(255, 255, 255)";
	this.ctx.fillRect(0, 0, w, h);
	
	// current time in decimal hours (0.00 ... 23.99)
	if (this.http_param('lat') && this.http_param('lon'))
	    hourNow = this.d.getUTCHours() + this.d.getUTCMinutes()/60 + this.d.getUTCSeconds()/3600;
	else
	    hourNow = this.d.getHours() + this.d.getMinutes()/60 + this.d.getSeconds()/3600;
	
	// Print hour tics
	this.ctx.fillStyle = cText;
	this.ctx.font = scale*0.02 + "pt Arial";
	this.ctx.textAlign = "center";
	var start = 1;
	var end = 24;
	if (this.mode == 12) {
	    if (this.d.getHours() > 12)
		start += 12;
	    else
		end /= 2;
	}
	for (i=start; i<=end; i++) {
	    var tmpx = cx + trad * Math.cos(this.hour2rad(i));
	    var tmpy = cy + trad * Math.sin(this.hour2rad(i)) + scale*0.01;
	    if (i%3==0)
		this.ctx.fillText(i, tmpx, tmpy);
	
	    // Hour tics
	    this.ctx.beginPath();   
	    this.ctx.moveTo(cx + (rad*1.03) * Math.cos(this.hour2rad(i)),
		       cy + (rad*1.03) * Math.sin(this.hour2rad(i)));
	    this.ctx.lineTo(cx + rad * Math.cos(this.hour2rad(i)), cy + rad * Math.sin(this.hour2rad(i)));
	    this.ctx.strokeStyle = "rgba(130,130,130,0.7)";
	    this.ctx.stroke();
	    this.ctx.closePath();
	}
    
    
	if (this.mode == 12) {
	    // Polar night (kaamos)
	    if (this.riseHour == 0 && this.setHour == 0 && latitude > polar_latitude) {
		this.drawSector( cx, cy, cNight, rad, 0, 2*Math.PI);
	    }
	    // Midnight sun (yötön yö)
	    else if (this.riseHour == 0 && this.setHour == 0 && latitude < -polar_latitude) {
		this.drawSector( cx, cy, cDay, rad, 0, 2*Math.PI);
	    }
	
	    // Sun down
	    else if ((hourNow < this.riseHour) || (hourNow > this.setHour)) {

		if ((this.setHour - this.riseHour) > 12) {
		    this.drawSector( cx, cy, cDay, rad, 0, 2*Math.PI); // day around the clock coming
		    this.drawSector( cx, cy, cNight, rad*0.9, this.hour2rad(this.riseHour), this.hour2rad(this.setHour));
		}
		else {
		    this.drawSector( cx, cy, cNight, rad, this.hour2rad(this.riseHour), this.hour2rad(this.setHour));
		    this.drawSector( cx, cy, cDay, rad, this.hour2rad(this.setHour), this.hour2rad(this.riseHour));
		    this.drawSector( cx, cy, cNight, rad*0.9, 0, 2*Math.PI); // night around the clock now
		}

	    }
	    // Sun up
	    else {
	    
		if ((this.setHour - this.riseHour) < 12) {
		    this.drawSector( cx, cy, cNight, rad, 0, 2*Math.PI); // night around the clock coming
		    this.drawSector( cx, cy, cNight, rad*0.9, 0, 2*Math.PI);
		    this.drawSector( cx, cy, cDay, rad*0.9, this.hour2rad(hourNow), this.hour2rad(this.riseHour));
		    this.drawSector( cx, cy, cDay, rad*0.9, this.hour2rad(this.setHour), this.hour2rad(hourNow));
		}
		else {
		    this.drawSector( cx, cy, cNight, rad, this.hour2rad(this.riseHour), this.hour2rad(this.setHour));
		    this.drawSector( cx, cy, cDay, rad, this.hour2rad(this.setHour), this.hour2rad(this.riseHour));
		    this.drawSector( cx, cy, cDay, rad*0.9, 0, 2*Math.PI); // day around the clock now
		}
	    }
	
	}
	// 24 hour display
	else {
	    this.drawSector( cx, cy, cNight, rad, this.hour2rad(this.riseHour), this.hour2rad(this.setHour));
	    this.drawSector( cx, cy, cDay, rad, this.hour2rad(this.setHour), this.hour2rad(this.riseHour));
	}
    
	// Clock hand
	this.ctx.beginPath();
	this.ctx.lineCap = 'round';
	this.ctx.moveTo(cx, cy);
	this.ctx.lineTo(cx + .97*rad * Math.cos(this.hour2rad(hourNow)), 
		   cy + .97*rad * Math.sin(this.hour2rad(hourNow)));
	this.ctx.strokeStyle = "rgba(255,120,60,0.8)";
	this.ctx.stroke();
	this.ctx.closePath();
    
	// Print day and night length
	var tmprad;
	if (this.mode == 12) {
	    tmpRad = this.hour2rad(this.riseHour + 0.5*(this.setHour-this.riseHour));
	    if (hourNow < this.riseHour || hourNow > this.setHour)
		tmpRad += Math.PI;
	}
	else
	    tmpRad = 0.5 * (this.hour2rad(this.setHour) + this.hour2rad(this.riseHour));
    
	var dlx = cx + (trad *.5) * Math.cos(tmpRad);
	var dly = cy + (trad *.5) * Math.sin(tmpRad);
	var nlx = cx + (trad *.5) * Math.cos(tmpRad + Math.PI);
	var nly = cy + (trad *.5) * Math.sin(tmpRad + Math.PI);
    
	this.ctx.textAlign = "center";

	if ( this.mode == 12 && (hourNow < this.riseHour || hourNow > this.setHour) && (24-this.setHour+this.riseHour)>12) {}
	// hide day length only if sun down and night runs around the clock
	else {
	    this.ctx.fillStyle = cNightL;
	    this.ctx.font = "bold "+scale*0.02+"pt Arial";
	    this.ctx.fillText("day length", dlx, dly-scale*0.02);
	    this.ctx.fillText(dayLen, dlx, dly+scale*0.02);
	}
	if ( this.mode == 12 && (hourNow > this.riseHour && hourNow < this.setHour) && (this.setHour-this.riseHour)>12 ) {}
	// hide night length only if sun up and day runs around the clock
	else {
	    this.ctx.fillStyle = cDayL;
	    this.ctx.font = "bold "+scale*0.02+"pt Arial";
	    this.ctx.fillText("night length", nlx, nly-scale*0.02);
	    this.ctx.fillText(nightLen, nlx, nly+scale*0.02);
	}
    
	// Show sunrise/sunset ticker	
	this.ctx.textAlign = "left";
    
	var time;
	var title;
	if (! this.http_param('lat'))
	    time = this.location_name + " " + this.d.toTimeString();
	else
	    time = this.location_name + " " + this.d.toUTCString();
    
	if (this.riseHour == 0 && this.setHour == 0 && latitude > polar_latitude)
	    title = "polar night";
	else if (this.riseHour == 0 && this.setHour == 0 && latitude < -polar_latitude)
	    title = "midnight sun";
	else if (hourNow < this.riseHour)
	    title = "sunrise in " + this.timeremaining(this.riseHour-hourNow);
	else if (hourNow < this.setHour)
	    title = "sunset in " + this.timeremaining(this.setHour-hourNow);
	else if (hourNow > this.setHour)
	    title = "sunrise in " + this.timeremaining(this.riseHour+(24-hourNow));

	this.ctx.fillStyle = "rgba(80,80,80,0.7)";
	this.ctx.font = fontsize_time + "pt Arial";
	this.ctx.fillText(time, 0.03*w, 0.04*h);
	this.ctx.font = "bold " + Math.floor(0.04*scale) + "pt Arial";
	this.ctx.fillText(title, 0.03*w, 0.11*h);

	// Print sunrise/sunset time labels
	if (this.riseHour == 0 && this.setHour == 0) {}
	else {
	    this.ctx.textAlign = "center";
	
	    if (this.riseHour < hourNow && hourNow < this.setHour)
		this.ctx.font = "bold " + fontsize + "pt Arial";
	    else
		this.ctx.font = fontsize + "pt Arial";
	
	    this.ctx.fillText("sunset", 
			 cx+rad_label*Math.cos(this.hour2rad(this.setHour)), 
			 cy+rad_label*Math.sin(this.hour2rad(this.setHour)));
	    this.ctx.fillText("at " + this.hourstr(this.setHour), 
			 cx+rad_label*Math.cos(this.hour2rad(this.setHour)), 
			 scale*0.03+cy+rad_label*Math.sin(this.hour2rad(this.setHour)));
	
	
	    if (hourNow < this.riseHour || hourNow > this.setHour)
		this.ctx.font = "bold " + fontsize + "pt Arial";
	    else
		this.ctx.font = fontsize + "pt Arial";
	
	    this.ctx.fillText("sunrise", 
			 cx+rad_label*Math.cos(this.hour2rad(this.riseHour)), 
			 cy+rad_label*Math.sin(this.hour2rad(this.riseHour)));
	    this.ctx.fillText("at " + this.hourstr(this.riseHour), 
			 cx+rad_label*Math.cos(this.hour2rad(this.riseHour)), 
			 scale*0.03+cy+rad_label*Math.sin(this.hour2rad(this.riseHour)));
	}
    }
}
