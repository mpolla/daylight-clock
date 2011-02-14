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
function drawSector(ctx, cx, cy, color, radius, start, stop) {

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
	return hours + " hours";
    else if (hours >= 1)
	return "one hour and " + mins + " minutes";
    else if (mins > 5)
	return mins + " minutes";
    else if (mins > 1)
	return mins + " minutes and " + secs + " seconds";
    else
	return secs + " seconds";
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
    
    var fontsize = 10;
    var linewidth = "6.0";
    var ic = 240;
    var cx = 150;
    var cy = 170;
    var rad = 90;
    var trad = rad + 14;
    var offset = -d.getTimezoneOffset() / 60;
    
    var canvas = document.getElementById("daylightometer");
    
    //var myLocation = new SunriseSunset( 2011, 0, 9, 67.8, 27); 
    var myLocation = new SunriseSunset( d.getFullYear(), d.getMonth()+1, d.getDate()+1, geoip_latitude(), geoip_longitude());
    
    var riseHour = myLocation.sunriseLocalHours(offset);
    var setHour = myLocation.sunsetLocalHours(offset);
    
    // Solstice workaround
    if (isNaN(riseHour))
	riseHour = 0.00;
    if (isNaN(setHour))
	setHour = 0.00;
    
    var dayLenH = Math.floor(setHour - riseHour);
    var dayLenM = Math.round(60 * ((setHour - riseHour) % 1));
    var dayLen = dayLenH + ":" + zeroPad(dayLenM, 2);
    
    var night = 24.0 - (setHour - riseHour);
    var nightLenH = Math.floor(night);
    var nightLenM = Math.round(60 * (night % 1));
    var nightLen = nightLenH + ":" + zeroPad(nightLenM, 2);
    
    if (canvas.getContext) {
	var ctx = canvas.getContext("2d");
	ctx.font = "" + fontsize + "pt Arial";
	ctx.lineWidth = linewidth;

	// background
	ctx.fillStyle = "rgb(255, 255, 255)";
	ctx.fillRect(0, 0, 280, 300);

	// Print debug info
	//ctx.fillStyle = cText;
	//ctx.fillText(d, ic, 20);
	//ctx.fillText("Sunrise " + hourstr(riseHour), ic, 35);
	//ctx.fillText("Sunset " + hourstr(setHour), ic, 50);
	//ctx.fillText("Coordinates " + geoip_latitude() + ", " + geoip_longitude(), ic, 65);
	//ctx.fillText("Offset " + -d.getTimezoneOffset() / 60 , ic, 80);
	//ctx.fillText("Day lenght " + dayLen , ic, 95);
	//ctx.fillText("Night lenght " + nightLen , ic, 110);

	// current time in decimal hours (0.00 ... 23.99)
	hourNow = d.getHours() + d.getMinutes()/60 + d.getSeconds()/3600;
	

	// Daytime sector
	if (mode == 12) {
	    // 12 hour display, ante meridiem

	    // Sun down
	    if ((hourNow < riseHour) || (hourNow > setHour)) {
		drawSector(ctx, cx, cy, cDay, rad, hour2rad(setHour, mode), hour2rad(riseHour, mode));
		drawSector(ctx, cx, cy, cNight, rad, hour2rad(riseHour, mode), hour2rad(setHour, mode));
		drawSector(ctx, cx, cy, cNight, rad-10, hour2rad(riseHour, mode), hour2rad(0, mode));
		drawSector(ctx, cx, cy, cNight, rad-10, hour2rad(0, mode), hour2rad(setHour, mode));
	    }
	    // Sun up
	    else {

		if ((setHour - riseHour) < 12) {
		    drawSector(ctx, cx, cy, cNight, rad, 0, 2*Math.PI);
		    drawSector(ctx, cx, cy, cNight, rad-10, 0, 2*Math.PI);
		    drawSector(ctx, cx, cy, cDay, rad-10, hour2rad(hourNow, mode), hour2rad(riseHour, mode));
		    drawSector(ctx, cx, cy, cDay, rad-10, hour2rad(setHour, mode), hour2rad(hourNow, mode));
		}
		else {
		    drawSector(ctx, cx, cy, cNight, rad, hour2rad(riseHour,mode), hour2rad(setHour,mode));
		    drawSector(ctx, cx, cy, cDay, rad, hour2rad(setHour,mode), hour2rad(riseHour,mode));

		    drawSector(ctx, cx, cy, cDay, rad-10, 0, 2*Math.PI);
		}

	    }

	}
	// 24 hour display
	else {
	    drawSector(ctx, cx, cy, cNight, rad, hour2rad(riseHour, mode), hour2rad(setHour, mode));
	    drawSector(ctx, cx, cy, cDay, rad, hour2rad(setHour, mode), hour2rad(riseHour, mode));
	}

	// Clock hand
	ctx.beginPath();      
	ctx.moveTo(cx, cy);
	ctx.lineTo(cx + rad * Math.cos(hour2rad(hourNow, mode)), cy + rad * Math.sin(hour2rad(hourNow, mode)));
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
	
	var dlx = cx + (trad / 3) * Math.cos(tmpRad) - (fontsize / 2);
	var dly = cy + (trad / 3) * Math.sin(tmpRad) + (fontsize / 2);
	var nlx = cx + (trad / 3) * Math.cos(tmpRad + Math.PI) - (fontsize / 2);
	var nly = cy + (trad / 3) * Math.sin(tmpRad + Math.PI) + (fontsize / 2);
	
	ctx.textAlign = "center";
	// display day length if sun is up and night is long
	if ( mode == 12 && (hourNow < riseHour || hourNow > setHour) && (24-setHour+riseHour)>12) {}
	else {
	    ctx.fillStyle = cNightL;
	    ctx.font = "bold 10pt Arial";
	    ctx.fillText("day length", dlx, dly-7);
	    ctx.fillText(dayLen, dlx, dly+7);
	}
	if ( mode == 12 && (hourNow > riseHour && hourNow < setHour) && (setHour-riseHour)>12 ) {}
	else {
	    ctx.fillStyle = cDayL;
	    ctx.font = "bold 10pt Arial";
	    ctx.fillText("night length", nlx, nly-7);
	    ctx.fillText(nightLen, nlx, nly+7);
	}
	
	    // Print hour tics
	ctx.fillStyle = cText;
	ctx.font = "10pt Arial";
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
	    var tmpy = cy + trad * Math.sin(hour2rad(i, mode)) + fontsize/2;
	    if (i%3==0)
		ctx.fillText(i, tmpx, tmpy);
	    
	    // Hour tics

	    ctx.beginPath();   
	    ctx.moveTo(cx + (rad+4) * Math.cos(hour2rad(i, mode)), cy + (rad+4) * Math.sin(hour2rad(i, mode)));
	    ctx.lineTo(cx + rad * Math.cos(hour2rad(i, mode)), cy + rad * Math.sin(hour2rad(i, mode)));
	    ctx.strokeStyle = "rgba(90,90,90,0.7)";
	    ctx.stroke();
	    ctx.closePath();
	}
	
	
	// Show sunrise/sunset ticker	
	ctx.textAlign = "left";
	ctx.font = "10pt Arial";
	ctx.fillText(geoip_city() + "/" + geoip_country_name() + " " + d.toTimeString(), 10, 15);
	ctx.font = "bold 14pt Arial";
	if (hourNow < riseHour)
	    ctx.fillText("sunrise in " + timeremaining(riseHour-hourNow), 10, 35);
	else if (hourNow < setHour)
	    ctx.fillText("sunset in " + timeremaining(setHour-hourNow), 10, 35);
	else if (hourNow > setHour)
	    ctx.fillText("sunrise in " + timeremaining(riseHour+(24-hourNow)), 10, 35);


	ctx.textAlign = "center";
	
	if (riseHour < hourNow && hourNow < setHour)
	    ctx.font = "bold " + fontsize + "pt Arial";
	else
	    ctx.font = fontsize + "pt Arial";
	
	ctx.fillText("sunset", cx+(rad*1.4)*Math.cos(hour2rad(setHour,mode)), cy+(rad*1.4)*Math.sin(hour2rad(setHour,mode)));
	ctx.fillText("at " + hourstr(setHour), cx+(rad*1.4)*Math.cos(hour2rad(setHour,mode)), 12+cy+(rad*1.4)*Math.sin(hour2rad(setHour,mode)));
	
	
	if (hourNow < riseHour || hourNow > setHour)
	    ctx.font = "bold " + fontsize + "pt Arial";
	else
	    ctx.font = fontsize + "pt Arial";
	
	ctx.fillText("sunrise", cx+(rad*1.4)*Math.cos(hour2rad(riseHour,mode)), cy+(rad*1.4)*Math.sin(hour2rad(riseHour,mode)));
	ctx.fillText("at " + hourstr(riseHour), cx+(rad*1.4)*Math.cos(hour2rad(riseHour,mode)), 12+cy+(rad*1.4)*Math.sin(hour2rad(riseHour,mode)));
	
    }
}

