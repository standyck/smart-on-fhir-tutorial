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
                    p.diagnoticreports = dr;
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
            acc.push('<dl>');
            for(var k in thing) {
                acc.push('<dt>' + k + '</dt>');
                acc.push('<dd>');
                acc = myself(thing[k], acc);
                acc.push('</dd>');
            }
            acc.push('</dl>');
            return acc;
        } else if ($.isArray(thing)) {
            acc.push('<ol>');
            thing.forEach(function(e) {
                acc.push('<li>');
                acc = myself(e, acc);
                acc.push('</li>');
            });
            acc.push('</ol>');
            return acc;
        } else {
            acc.push(thing);
            return acc;
        }
    };

})(window);
