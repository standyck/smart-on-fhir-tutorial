(function(window){
    window.extractData = function() {
        var ret = $.Deferred();

        function onError() {
            console.log('Loading error', arguments);
            ret.reject();
        }

        function onReady(smart)  {
            if (smart.hasOwnProperty('patient')) {
                var patient = smart.patient;
                var pt = patient.read();
                var dr = smart.patient.api.fetchAll({
                    type: 'DiagnosticReport'
                });

                $.when(pt, dr).fail(onError);

                $.when(pt, dr).done(function(patient, dr) {
                    console.log('dr=' + dr);
                    var gender = patient.gender;
                    var dob = new Date(patient.birthDate);
                    var day = dob.getDate();
                    var monthIndex = dob.getMonth() + 1;
                    var year = dob.getFullYear();

                    var dobStr = monthIndex + '/' + day + '/' + year;
                    var fname = '';
                    var lname = '';

                    if (typeof patient.name[0] !== 'undefined') {
                        fname = patient.name[0].given.join(' ');
                        lname = patient.name[0].family.join(' ');
                    }


                    var p = defaultPatient();
                    p.birthdate = dobStr;
                    p.gender = gender;
                    p.fname = fname;
                    p.lname = lname;
                    p.age = parseInt(calculateAge(dob));

                    var drs = [];

                    dr.forEach(function(dreport) {
                        drs.push(processRawDR(dreport));
                    });

                    p.diagnoticreports = drs;
                    ret.resolve(p);
                });
            } else {
                onError();
            }
        }

        FHIR.oauth2.ready(onReady, onError);
        return ret.promise();

    };

    function defaultPatient(){
        return {
            fname: {value: ''},
            lname: {value: ''},
            gender: {value: ''},
            birthdate: {value: ''},
            age: {value: ''},
            diagnoticreports : {value: ''}
        };
    }

    function processRawDR(DReport) {
        var rtn = {};
        rtn['id'] = DReport.id;
        rtn['status'] = DReport.status;
        rtn['category'] = DReport.category.text;
        rtn['effectiveDateTime'] = DReport.effectiveDateTime;
        rtn['text'] = DReport.text;
        return rtn;
    }

    function isLeapYear(year) {
        return new Date(year, 1, 29).getMonth() === 1;
    }

    function calculateAge(date) {
        if (Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime())) {
            var d = new Date(date), now = new Date();
            var years = now.getFullYear() - d.getFullYear();
            d.setFullYear(d.getFullYear() + years);
            if (d > now) {
                years--;
                d.setFullYear(d.getFullYear() - 1);
            }
            var days = (now.getTime() - d.getTime()) / (3600 * 24 * 1000);
            return years + days / (isLeapYear(now.getFullYear()) ? 366 : 365);
        }
        else {
            return undefined;
        }
    }

    window.drawVisualization = function(p) {
        $('#holder').show();
        $('#loading').hide();
        $('#fname').html(p.fname);
        $('#lname').html(p.lname);
        $('#gender').html(p.gender);
        $('#birthdate').html(p.birthdate);
        $('#age').html(p.age);
        var drHtml = render(p.diagnoticreports, []);
        $('#drs').html(drHtml.join(""));
    };

    var render = function  myself(thing, acc) {
        if($.isPlainObject(thing)) {
            var rtnO = [];
            rtnO.push('<dl>');
            for(var k in thing) {
                rtnO.push('<dt>' + k + '<dt>');
                rtnO.push('<dd>');
                rtnO.concat(myself(thing[k], acc));
                rtnO.push('</dd>');
            }
            rtnO.push('</dl>');
            return acc.concat(rtnO);
        } else if ($.isArray(thing)) {
            var rtnA = [];
            rtnA.push('<ol>');
            thing.forEach(function(e) {
                rtnA.push('<li>');
                rtnA.concat(myself(e, acc));
                rtnA.push('</li>');
            });
            rtnA.push('</ol>');
            return acc.concat(rtnA);
        } else {
            acc.concat(thing);
            return acc;
        }
    };

})(window);
