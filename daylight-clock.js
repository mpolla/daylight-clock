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
//
// Example usage:
//
//
// <!doctype html>
//
// <html>
// <head></head>
// <body>
//   <canvas id="daylight-clock" width="400" height="400"></canvas>
//   <script type="text/javascript" src="./SunriseSunset.js"></script>
//   <script type="text/javascript" src="http://j.maxmind.com/app/geoip.js"></script>
//   <script type="text/javascript" src="./daylight-clock.js"></script>
// </body>
// </html>

/*global window*/
/*global document*/

var setInterval;
var SunriseSunset;
var geoip_latitude, geoip_longitude, geoip_city, geoip_country_name;
var zeroPad, dom12h, dom24h, DaylightClock;

var dc;

window.onresize = function (event) {
    var tmpMode = dc.getMode();
    dc = new DaylightClock();
    dc.setMode(tmpMode);
    dc.init();
};


// Left zero-pad numbers
function zeroPad(number, width) {
    width -= number.toString().length;
    if (width > 0) {
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
    }
    return number;
}

// Constructor
var DaylightClock = function () {

    // Define colors
    this.cNight = "rgba(0,0,90,1)";
    this.cNightL = "rgba(40,40,120,1)";
    this.cDay = "rgba(190,190,220,1)";
    this.cDayL = "rgba(140,140,200,1)";
    this.cText = "rgba(100,100,100,0.9)";
    this.cBackground = "rgb(255,255,255)";
    this.cTitle = "rgba(80,80,80,0.7)";
    this.cTic = "rgba(130,130,130,0.7)";
    this.cClockHand = "rgba(255,120,60,0.8)";

    // Grab the canvas context.
    this.canvas = document.getElementById("daylight-clock");
    this.ctx = this.canvas.getContext("2d");

    // Scale to fullscreen
    this.ctx.canvas.width  = window.innerWidth - 20;
    this.ctx.canvas.height = window.innerHeight - 10;
    this.w = this.ctx.canvas.width;
    this.h = this.ctx.canvas.height;

    // Layout scaling
    this.scale = 0.8 * Math.min(this.w, this.h) + 0.2 * Math.max(this.w, this.h);

    this.rad = 0.28 * this.scale;
    this.innerRad = 0.9 * this.rad;
    this.trad = 1.15 * this.rad;

    this.polar_latitude = 66;
    this.cx = 0.5 * this.w;
    this.cy = 0.52 * this.h;
    this.handLength = 0.97 * this.rad;

    this.fontSize = 0.02 * this.scale;

    this.innerLabelRadius = 0.5 * this.rad;
    this.innerLabelFontSize = 0.02 * this.scale;
    this.innerLabelLineHeight = 0.02 * this.scale;

    this.outerLabelRadius = 1.38 * this.rad;
    this.outerLabelFontSize = 0.02 * this.scale;
    this.outerLabelLineHeight = 0.02 * this.scale;

    this.titleFontSize = Math.floor(0.04 * this.scale);
    this.timeFontSize = 0.02 * this.scale;
    this.fontFamily = "Arial";

    this.timeStrX = 0.03 * this.w;
    this.timeStrY = 2.2 * this.timeFontSize;
    this.titleStrX = 0.03 * this.w;
    this.titleStrY = 2.8 * this.titleFontSize;
};

// Adapted from
// http://www.netlobo.com/url_query_string_javascript.html
DaylightClock.prototype.httpParam = function (param) {
    var regexS, regex, results;
    //param = param.replce("/[\[]/","\\\[").replace("/[\]]/","\\\]");
    regexS = "[\\?&]" + param + "=([^&#]*)";
    regex = new RegExp(regexS);
    results = regex.exec(window.location.href);
    if (results === null) {
        return "";
    } else {
        return results[1];
    }
};

// Initialization routine
DaylightClock.prototype.init = function () {

    this.d = new Date();
    this.offset =  -this.d.getTimezoneOffset() / 60;

    // Find out where we are, either by HTTP parameters
    // or a geoIP query.
    this.location_name = '';
    this.longitude = parseFloat(this.httpParam('lon'));
    this.latitude = parseFloat(this.httpParam('lat'));
    // Check for lat/long coordinates in URL parameters
    if (!this.httpParam('lat') && !this.httpParam('long')) {
        this.geoIP();
    } else {
        this.location_name = this.coordstr(this.latitude, this.longitude);
    }

    this.update();
};

DaylightClock.prototype.resize = function () {
    // Scale to fullscreen
    this.ctx.canvas.width  = window.innerWidth - 20;
    this.ctx.canvas.height = window.innerHeight - 10;
    this.w = this.ctx.canvas.width;
    this.h = this.ctx.canvas.height;
};

// Change display mode between 12H/24H display.
DaylightClock.prototype.setMode = function (newmode) {
    this.mode = newmode;
};

// Get display mode.
DaylightClock.prototype.getMode = function () {
    return this.mode;
};

// Transform floating point hours (0.00 ... 23.99)
// into radians (-PI/4 ... + 3*PI/4)
DaylightClock.prototype.h2rad = function (hour) {
    if (this.mode === 12) {
        if (12 <= hour) {
            hour = hour - 12;
        }
        return -Math.PI / 2 + (hour / 12.0) * Math.PI * 2;
    }
    return -Math.PI / 2 + (hour / 24.0) * Math.PI * 2;
};

// Update time and sunset/sunrise information and redraw.
DaylightClock.prototype.update = function () {

    var rh, sh, rht, sht, dt;

    this.d = new Date();
    dt = new Date(this.d.getTime() + 1000 * 60 * 60 * 24);

    this.offset =  -this.d.getTimezoneOffset() / 60;

    // current time in decimal hours (0.00 ... 23.99)
    if (this.httpParam('lat') && this.httpParam('lon')) {
        this.hourNow = this.d.getUTCHours() + this.d.getUTCMinutes() / 60 + this.d.getUTCSeconds() / 3600;
    } else {
        this.hourNow = this.d.getHours() + this.d.getMinutes() / 60 + this.d.getSeconds() / 3600;
    }

    this.ss = new SunriseSunset(this.d.getFullYear(),
                                this.d.getMonth() + 1,
                                this.d.getDate() + 1,
                                this.latitude,
                                this.longitude);

    this.sst = new SunriseSunset(dt.getFullYear(),
                                 dt.getMonth() + 1,
                                 dt.getDate() + 1,
                                 this.latitude,
                                 this.longitude);


    if (this.httpParam('lat') && this.httpParam('lon')) {
        rh = this.ss.sunriseUtcHours(this.offset);
        sh = this.ss.sunsetUtcHours(this.offset);
        rht = this.sst.sunriseUtcHours(this.offset);
        sht = this.sst.sunsetUtcHours(this.offset);
    } else {
        rh = this.ss.sunriseLocalHours(this.offset);
        sh = this.ss.sunsetLocalHours(this.offset);
        rht = this.sst.sunriseLocalHours(this.offset);
        sht = this.sst.sunsetLocalHours(this.offset);

    }

    // Display tomorrow's times if sunrise/sunset has passed for today.
    if (this.hourNow > rh && this.hourNow > rht) {
        this.riseHour = rht;
    } else {
        this.riseHour = rh;
    }
    if (this.hourNow > sh && this.hourNow > sht) {
        this.setHour = sht;
    } else {
        this.setHour = sh;
    }

    this.draw();
};

// Transform floating point value into hour representation
// e.g. 16.82 --> "16:49"
DaylightClock.prototype.hourstr = function (hour) {
    var fullHrs = Math.floor(hour);
    return fullHrs + ":" +
        zeroPad(Math.round(60 * (hour - fullHrs)), 2);
};

// Draw sector
DaylightClock.prototype.drawSector = function (color, radius, start, stop) {

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(this.cx, this.cy);
    this.ctx.arc(this.cx, this.cy, radius, start, stop, true);
    this.ctx.closePath();
    this.ctx.fill();
};

// Format the title string describing time left
// to next sunrise/sunset.
DaylightClock.prototype.timeremaining = function (time) {

    var hours, mins, secs;
    hours = Math.floor(time);
    mins = Math.floor((time - hours) * 60);
    secs = Math.floor(3600 * (time - hours - mins / 60));

    //return hours + ":" + mins + ":" + secs;
    if (hours >= 2) {
        return Math.round(time) + " hours";
    } else if (hours >= 1) {
        return "one hour and " + mins + " minutes";
    } else if (mins > 5) {
        return mins + " minutes";
    } else if (mins >= 1) {
        return mins + " minutes and " + secs + " seconds";
    } else {
        return secs + " seconds";
    }
};


// Transform floating point coordinates to
// N/S,W/E notation.
DaylightClock.prototype.coordstr = function (lat, lon) {
    var latstr, lonstr;
    latstr = "N";
    lonstr = "W";

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
};

DaylightClock.prototype.dayLength = function () {
    if (this.polarNight()) {
        return 0.0;
    } else if (this.midnightSun()) {
        return 24.0;
    }
    return this.setHour - this.riseHour;
};

DaylightClock.prototype.nightLength = function () {
    if (this.polarNight()) {
        return 24.0;
    } else if (this.midnightSun()) {
        return 0.0;
    }
    return 24.0 - this.dayLength();
};

DaylightClock.prototype.sunUp = function () {
    if (this.riseHour < this.hourNow && this.hourNow < this.setHour) {
        return true;
    } else {
        return false;
    }
};

// SunriseSunset gives NaNs for sunset/sunset times for polar night and
// polar day (midnight sun).
DaylightClock.prototype.polarNight = function () {
    if (this.riseHour === 0 && this.setHour === 0) {
        // Northern polar region, summer
        if (Math.abs(this.d.getMonth() + 1 - 6) > 3 && this.latitude > this.polar_latitude) {
            return true;
        } else if (Math.abs(this.d.getMonth() + 1 - 6) < 3 && this.latitude <  -this.polar_latitude) {
            // Southern polar region, summer
            return true;
        }
    }
    return false;
};

// SunriseSunset gives NaNs for sunset/sunset times for polar night and
// polar day (midnight sun).
DaylightClock.prototype.midnightSun = function () {
    if (this.riseHour === 0 && this.setHour === 0) {
        // Northern polar region, winter
        if (Math.abs(this.d.getMonth() + 1 - 6) < 3 && this.latitude > this.polar_latitude) {
            return true;
        } else if (Math.abs(this.d.getMonth() + 1 - 6) > 3 && this.latitude <  -this.polar_latitude) {
            // Southern polar region, winter
            return true;
        }
    }
    return false;
};

// Detect location using maxmind.com's service.
DaylightClock.prototype.geoIP = function () {
    try {
        this.latitude = geoip_latitude();
        this.longitude = geoip_longitude();
        this.location_name = geoip_city() + "/" + geoip_country_name();
    } catch (exception) {
        this.latitude = 0;
        this.longitude = 0;
        this.location_name = "Unknown location";
    }
};

// Draw clock
DaylightClock.prototype.draw = function () {

    var i, start, end, time, title, dlx, dly, nlx, nly, tmpRad, tmpx, tmpy;

    // Solstice workaround
    if (isNaN(this.riseHour)) {
        this.riseHour = 0.00;
    }
    if (isNaN(this.setHour)) {
        this.setHour = 0.00;
    }

    this.ctx.font = Math.floor(0.05 * this.scale) + "pt " + this.fontFamily;
    this.ctx.lineWidth = this.scale * 0.018;

    // background
    this.ctx.fillStyle = this.cBackground;
    this.ctx.fillRect(0, 0, this.w, this.h);

    // Print hour tics
    this.ctx.fillStyle = this.cText;
    this.ctx.font = this.fontSize + "pt " + this.fontFamily;
    this.ctx.textAlign = "center";

    start = 1;
    end = 24;

    if (this.mode === 12) {
        if (this.d.getHours() > 12) {
            start += 12;
        } else {
            end /= 2;
        }
    }
    for (i = start; i <= end; i += 1) {
        tmpx = this.cx + this.trad * Math.cos(this.h2rad(i));
        tmpy = this.cy + this.trad * Math.sin(this.h2rad(i)) + this.fontSize / 2;
        if (i % 3 === 0) {
            this.ctx.fillText(i, tmpx, tmpy);
        }

        // Hour tics
        this.ctx.beginPath();
        this.ctx.moveTo(this.cx + this.rad * Math.cos(this.h2rad(i)),
                        this.cy + this.rad * Math.sin(this.h2rad(i)));
        this.ctx.lineTo(this.cx + this.rad * Math.cos(this.h2rad(i)),
                        this.cy + this.rad * Math.sin(this.h2rad(i)));
        this.ctx.strokeStyle = this.cTic;
        this.ctx.stroke();
        this.ctx.closePath();
    }


    if (this.mode === 12) {
        // Polar night (kaamos)
        if (this.polarNight()) {
            this.drawSector(this.cNight, this.rad, 0, 2 * Math.PI);
        } else if (this.midnightSun()) {
            // Midnight sun(yötön yö)
            this.drawSector(this.cDay, this.rad, 0, 2 * Math.PI);
        } else if (!this.sunUp()) {

            if (this.dayLength() > 12) {
                this.drawSector(this.cDay, this.rad, 0, 2 * Math.PI); // day around the clock coming
                this.drawSector(this.cNight, this.innerRad,
                                this.h2rad(this.riseHour),
                                this.h2rad(this.setHour));
            } else {
                this.drawSector(this.cNight, this.rad,
                                this.h2rad(this.riseHour),
                                this.h2rad(this.setHour));
                this.drawSector(this.cDay, this.rad,
                                this.h2rad(this.setHour),
                                this.h2rad(this.riseHour));
                this.drawSector(this.cNight, this.innerRad,
                                0, 2 * Math.PI); // night around the clock now
            }

        } else { // sun is up

            if (this.dayLength() < 12) {
                this.drawSector(this.cNight, this.rad, 0, 2 * Math.PI); // night around the clock coming
                this.drawSector(this.cNight, this.innerRad, 0, 2 * Math.PI);
                this.drawSector(this.cDay, this.innerRad,
                                this.h2rad(this.hourNow),
                                this.h2rad(this.riseHour));
                this.drawSector(this.cDay, this.innerRad,
                                this.h2rad(this.setHour),
                                this.h2rad(this.hourNow));
            } else {
                this.drawSector(this.cNight, this.rad,
                                this.h2rad(this.riseHour),
                                this.h2rad(this.setHour));
                this.drawSector(this.cDay, this.rad,
                                this.h2rad(this.setHour),
                                this.h2rad(this.riseHour));
                this.drawSector(this.cDay, this.innerRad,
                                0, 2 * Math.PI); // day around the clock now
            }
        }

    } else {  // 24 hour display
        this.drawSector(this.cNight, this.rad,
                        this.h2rad(this.riseHour),
                        this.h2rad(this.setHour));
        this.drawSector(this.cDay, this.rad,
                        this.h2rad(this.setHour),
                        this.h2rad(this.riseHour));
    }

    // Clock hand
    this.ctx.beginPath();
    this.ctx.lineCap = 'round';
    this.ctx.moveTo(this.cx, this.cy);
    this.ctx.lineTo(this.cx + this.handLength * Math.cos(this.h2rad(this.hourNow)),
                    this.cy + 0.97 * this.rad * Math.sin(this.h2rad(this.hourNow)));
    this.ctx.strokeStyle = this.cClockHand;
    this.ctx.stroke();
    this.ctx.closePath();

    // Print day and night length
    if (this.mode === 12) {
        tmpRad = this.h2rad(this.riseHour + 0.5 * (this.setHour - this.riseHour));
        if (this.hourNow < this.riseHour || this.hourNow > this.setHour) {
            tmpRad += Math.PI;
        }
    } else {
        tmpRad = 0.5 * (this.h2rad(this.setHour) + this.h2rad(this.riseHour));
    }

    dlx = this.cx + this.innerLabelRadius * Math.cos(tmpRad);
    dly = this.cy + this.innerLabelRadius * Math.sin(tmpRad);
    nlx = this.cx + this.innerLabelRadius * Math.cos(tmpRad + Math.PI);
    nly = this.cy + this.innerLabelRadius * Math.sin(tmpRad + Math.PI);

    this.ctx.textAlign = "center";

    // hide day length only if sun down and night runs around the clock
    if (!(this.mode === 12 && !this.sunUp() && this.nightLength() > 12)) {
        this.ctx.fillStyle = this.cNightL;
        this.ctx.font = "bold " + this.innerLabelFontSize + "pt " + this.fontFamily;
        this.ctx.fillText("day length", dlx, dly - this.innerLabelLineHeight);
        this.ctx.fillText(this.hourstr(this.dayLength()), dlx, dly + this.innerLabelLineHeight);
    }


    // hide night length only if sun up and day runs around the clock
    if (!(this.mode === 12 && this.sunUp() && this.dayLength() > 12)) {
        this.ctx.fillStyle = this.cDayL;
        this.ctx.font = "bold " + this.innerLabelFontSize + "pt " + this.fontFamily;
        this.ctx.fillText("night length", nlx, nly - this.innerLabelLineHeight);
        this.ctx.fillText(this.hourstr(this.nightLength()), nlx, nly + this.innerLabelLineHeight);
    }

    // Show sunrise/sunset ticker
    this.ctx.textAlign = "left";

    // Use UTC time when coordinates are given explicitly and
    // localtime when detecting location using geoIP.
    if (this.httpParam('lat') && this.httpParam('lon')) {
        time = this.location_name + " " + this.d.toUTCString();
    } else {
        time = this.location_name + " " + this.d.toTimeString();
    }

    // Set title string
    if (this.polarNight()) {
        title = "polar night";
    } else if (this.midnightSun()) {
        title = "midnight sun";
    } else if (this.hourNow < this.riseHour) {
        title = "sunrise in " + this.timeremaining(this.riseHour - this.hourNow);
    } else if (this.hourNow < this.setHour) {
        title = "sunset in " + this.timeremaining(this.setHour - this.hourNow);
    } else if (this.hourNow > this.setHour) {
        title = "sunrise in " + this.timeremaining(this.riseHour + (24 - this.hourNow));
    }

    this.ctx.fillStyle = this.cTitle;
    this.ctx.font = this.timeFontSize + "pt " + this.fontFamily;
    this.ctx.fillText(time, this.timeStrX, this.timeStrY);
    this.ctx.font = "bold " + this.titleFontSize + "pt " + this.fontFamily;
    this.ctx.fillText(title, this.titleStrX, this.titleStrY);

    // Print sunrise/sunset time labels
    if (!(this.riseHour === 0 && this.setHour === 0)) {
        this.ctx.textAlign = "center";
        if (this.riseHour < this.hourNow && this.hourNow < this.setHour) {
            this.ctx.font = "bold " + this.outerLabelFontSize + "pt " + this.fontFamily;
        } else {
            this.ctx.font = this.outerLabelFontSize + "pt " + this.fontFamily;
        }

        this.ctx.fillText("sunset",
                          this.cx + this.outerLabelRadius * Math.cos(this.h2rad(this.setHour)),
                          -this.outerLabelLineHeight + this.cy + this.outerLabelRadius * Math.sin(this.h2rad(this.setHour)));
        this.ctx.fillText("at " + this.hourstr(this.setHour),
                          this.cx + this.outerLabelRadius * Math.cos(this.h2rad(this.setHour)),
                          this.outerLabelLineHeight + this.cy + this.outerLabelRadius * Math.sin(this.h2rad(this.setHour)));

        if (this.hourNow < this.riseHour || this.hourNow > this.setHour) {
            this.ctx.font = "bold " + this.outerLabelFontSize
                + "pt " + this.fontFamily;
        } else {
            this.ctx.font = this.outerLabelFontSize
                + "pt " + this.fontFamily;
        }

        this.ctx.fillText("sunrise",
                          this.cx + this.outerLabelRadius * Math.cos(this.h2rad(this.riseHour)),
                          -this.outerLabelLineHeight + this.cy + this.outerLabelRadius * Math.sin(this.h2rad(this.riseHour)));
        this.ctx.fillText("at " + this.hourstr(this.riseHour),
                          this.cx + this.outerLabelRadius * Math.cos(this.h2rad(this.riseHour)),
                          this.outerLabelLineHeight + this.cy + this.outerLabelRadius * Math.sin(this.h2rad(this.riseHour)));
    }
};

// Calling dc.update() from setInterval doesn't
// work without an eval call so use a helper function.
function dcUpdate() {
    dc.update();
}

dc = new DaylightClock();

// 12 hour format
(function dom12h() {
    dc.setMode(12);
    dc.init();
    setInterval(dcUpdate, 1000);
}());

// 24 hour format
function dom24h() {
    dc.setMode(24);
    dc.init();
    setInterval(dcUpdate, 1000);
}
