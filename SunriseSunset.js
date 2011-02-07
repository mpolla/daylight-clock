// SunriseSunset Class (2011-01-30)
//   Implementation of http://williams.best.vwh.net/sunrise_sunset_algorithm.htm
//
//   Copyright (c) 2011, Preston Hunt <me@prestonhunt.com>
//   All rights reserved.
//
//   Redistribution and use in source and binary forms, with or without
//   modification, are permitted provided that the following conditions
//   are met:
//
//   Redistributions of source code must retain the above copyright
//   notice, this list of conditions and the following disclaimer.
//   Redistributions in binary form must reproduce the above copyright
//   notice, this list of conditions and the following disclaimer in the
//   documentation and/or other materials provided with the
//   distribution.
//
//   The name of Preston Hunt may be used to endorse or promote products
//   derived from this software without specific prior written
//   permission.
//
//   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
//   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
//   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
//   FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
//   COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
//   INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//   (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
//   SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
//   HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
//   STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//   ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
//   OF THE POSSIBILITY OF SUCH DAMAGE.
//
//   Provides sunrise and sunset times for specified date and position.
//   All dates are UTC.  Year is 4-digit.  Month is 1-12.  Day is 1-31.
//   Longitude is positive for east, negative for west.
//
//   Sample usage:
//   var tokyo = new SunriseSunset( 2011, 1, 19, 35+40/60, 139+45/60); 
//   tokyo.sunriseUtcHours()      --> 21.8199 = 21:49 GMT
//   tokyo.sunsetUtcHours()       --> 7.9070  = 07:54 GMT
//   tokyo.sunriseLocalHours(9)   --> 6.8199  = 06:49 at GMT+9
//   tokyo.sunsunsetLocalHours(9) --> 16.9070 = 16:54 at GMT+9
//   tokyo.isDaylight(1.5)        --> true
//
//   var losangeles = new SunriseSunset( 2011, 1, 19, 34.05, -118.233333333 );
//   etc.

var SunriseSunset = function( utcFullYear, utcMonth, utcDay, latitude, longitude ) {
    this.zenith = 90 + 50/60; //   offical      = 90 degrees 50'
                              //   civil        = 96 degrees
                              //   nautical     = 102 degrees
                              //   astronomical = 108 degrees

    this.utcFullYear = utcFullYear;
    this.utcMonth = utcMonth;
    this.utcDay = utcDay;
    this.latitude = latitude;
    this.longitude = longitude;

    this.rising = true; // set to true for sunrise, false for sunset
    this.lngHour = this.longitude / 15;
};

SunriseSunset.prototype = {
    sin: function( deg ) { return Math.sin( deg * Math.PI / 180 ); },
    cos: function( deg ) { return Math.cos( deg * Math.PI / 180 ); },
    tan: function( deg ) { return Math.tan( deg * Math.PI / 180 ); },
    asin: function( x ) { return (180/Math.PI) * Math.asin(x); },
    acos: function( x ) { return (180/Math.PI) * Math.acos(x); },
    atan: function( x ) { return (180/Math.PI) * Math.atan(x); },

    getDOY: function() {
        var month = this.utcMonth;
        var year = this.utcFullYear;
        var day = this.utcDay;

        var N1 = Math.floor( 275 * month / 9 );
        var N2 = Math.floor( (month + 9) / 12 );
        var N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4 ) + 2) / 3));
        var N = N1 - (N2 * N3) + day - 30;
        return N;
    },

    approximateTime: function() {
        var doy = this.getDOY();
        if ( this.rising ) {
            return doy + ((6 - this.lngHour) / 24);
        } else {
            return doy + ((18 - this.lngHour) / 24);
        }
    },

    meanAnomaly: function() {
        var t = this.approximateTime();
        return (0.9856 * t) - 3.289;
    },

    trueLongitude: function() {
        var M = this.meanAnomaly();
        var L = M + (1.916 * this.sin(M)) + (0.020 * this.sin(2 * M)) + 282.634;
        return L % 360;
    },

    rightAscension: function() {
        var L = this.trueLongitude();
        var RA = this.atan(0.91764 * this.tan(L));
        RA %= 360;

        var Lquadrant  = (Math.floor( L/90)) * 90;
        var RAquadrant = (Math.floor(RA/90)) * 90;
        RA = RA + (Lquadrant - RAquadrant);
        RA /= 15;

        return RA;
    },

    sinDec: function() {
        var L = this.trueLongitude();
        var sinDec = 0.39782 * this.sin(L);
        return sinDec;
    },

    cosDec: function() {
        return this.cos(this.asin(this.sinDec()));
    },

    localMeanTime: function() {
        var cosH = (this.cos(this.zenith) - (this.sinDec() * this.sin(this.latitude))) 
            / (this.cosDec() * this.cos(this.latitude));

        if (cosH >  1) {
            return "the sun never rises on this location (on the specified date)";
        } else if (cosH < -1) {
            return "the sun never sets on this location (on the specified date)";
        } else {
            var H = this.rising ? 360 - this.acos(cosH) : this.acos(cosH);
            H /= 15;
            var RA = this.rightAscension();
            var t = this.approximateTime();
            var T = H + RA - (0.06571 * t) - 6.622;
            return T;
        }
    },

    UTCTime: function() {
        var T = this.localMeanTime();
        var UT = T - this.lngHour;
        return UT % 24;
    },

    sunriseUtcHours: function() {
        this.rising = true;
        return this.UTCTime();
    },

    sunsetUtcHours: function() {
        this.rising = false;
        return this.UTCTime();
    },

    hoursRange: function( h ) {
        if ( h >= 24 ) {
            return h - 24;
        } else if ( h < 0 ) {
            return h + 24;
        } else {
            return h;
        }
    },

    sunriseLocalHours: function(gmt) {
        return this.hoursRange( gmt + this.sunriseUtcHours() );
    },

    sunsetLocalHours: function(gmt) {
        return this.hoursRange( gmt + this.sunsetUtcHours() );
    },

    isDaylight: function( utcCurrentHours ) {
        var sunriseHours = this.sunriseUtcHours();
        var sunsetHours = this.sunsetUtcHours();

        //print( "rise", sunriseHours );
        //print( "set", sunsetHours );

        if ( sunsetHours < sunriseHours ) {
            // Either the sunrise or sunset time is for tomorrow
            if ( utcCurrentHours > sunriseHours ) {
                return true;
            } else if ( utcCurrentHours < sunsetHours ) {
                return true;
            } else {
                return false;
            }
        }

        if ( utcCurrentHours >= sunriseHours ) {
            return utcCurrentHours < sunsetHours;
        } 

        return false;
    }
};

function SunriseSunsetTest() {
    var testcases = {
        'Los Angeles': {
            'year': 2011, 'month': 1, 'day': 22,
            'lat': 34.05, 'lon': -118.23333333,
            'tests': { // utcHours => isDaylight?
                19.6666666: true
            }
        },
        'Berlin': {
            'year': 2011, 'month': 1, 'day': 25,
            'lat': 52.5, 'lon': 13.366666667,
            'tests': { // utcHours => isDaylight?
                1.25: false
            }
        },
        'Tokyo': {
            'year': 2011, 'month': 1, 'day': 23,
            'lat': 35+40/60, 'lon': 139+45/60,
            'tests': { // utcHours => isDaylight?
                1.5: true,
                22.5: true
            }
        },
        'New Delhi': {
            'year': 2011, 'month': 1, 'day': 22,
            'lat': 35+40/60, 'lon': 139+45/60,
            'tests': { // utcHours => isDaylight?
            }
        }
    };

    var tests_run = 0;
    var tests_failed = 0;

    for ( var city_name in testcases ) {
        var city = testcases[ city_name ];
        var ss = new SunriseSunset( city.year, city.month, city.day, city.lat, city.lon );
        for ( var t in city.tests ) {
            var expected = city.tests[t];
            var result = ss.isDaylight( t );
            var passed = result === expected;

            tests_run++;
            if ( ! passed ) tests_failed++;
            
            //print( city_name, t, "passed:", passed );
        }
    }

    //print( "tests: " + tests_run, "failed: " + tests_failed );
}
