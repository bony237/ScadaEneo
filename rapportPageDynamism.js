/*
* Initialisatin !!
* */
var dptsClose = [],
    dptsOpen = [];

$('#divSelectDepart').toggle(false);
document.getElementsByTagName('form')[0].reset();
$('#rapportDepart').hide();

repertoryDeparts();
offPostes();

/*  END !!
* */

/*  choix du départ sur qui donner un rapport
* */

$('#selectDepart').click(function () {
    $('#divSelectDepart').toggle();
});



$('#formSelectDepart').submit(function (event) {
    var valDpt = $('#inputSelectDepart').val();

    $('.noExist, .noClose, #rapportDepart').toggle(false);

    creerRapportDepart(valDpt);

    event.preventDefault();
});

/*  Fin !
* */

function creerRapportDepart(depart) {

    if(dptsClose.indexOf(depart) >= 0){

        var filtrePostes = {
                'departActuel': {'$regex': depart, '$options': 'i'},
                'typeElm': 'elmPoste'
            },
            filtreLimits = {
                'departActuel': {'$regex': depart, '$options': 'i'},
                'typeElm': { '$in': ['elmOCRIACM', 'elmOCRPoste'] },
                'theCommand': {
                    '$ne': 'closeOCR'
                }
            };


        getAndFixLimits(filtreLimits);

        getAndFixPostes(filtrePostes);

        $('#nomDepart').text(depart);                                         // restitution du nom de départ

        $('#rapportDepart').show();

    }
    else if(dptsOpen.indexOf(depart) >= 0){
        $('.noClose').show();
        $('#rapportDepart').hide();
    }
    else{
        $('.noExist').show();
        $('#rapportDepart').hide();
    }

}

function repertoryDeparts() {
    $.ajax({
        type:'POST',
        url: 'collectElm.php',
        async: false,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: JSON.stringify({ 'typeElm': 'elmOCRDepart' }),
        success: function(dataString){
            //fillDataList
            var data = JSON.parse(dataString);
            if(data.length > 0){
                $('#departsRepertory').html('');
                data.forEach(function (t) {
                    var option = document.createElement('option');
                    $(option).val(t.departInstall).appendTo('#departsRepertory');

                    if(t.theCommand === 'closeOCR') dptsClose.push(t.departInstall);
                    else dptsOpen.push(t.departInstall);
                });
            }
        },
        error: function (result, statut, err) {
        },
        complete: function (result, statut, err) {
        }
    });
}

function offPostes() {
    $.ajax({
        type:'POST',
        url: 'collectElm.php',
        async: false,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: JSON.stringify({
            'typeElm': 'elmPoste',
            'departActuel': ''
        }),
        success: function(dataString){
            //fillDataList
            var data = JSON.parse(dataString);
            $('#nbrePosteDelest').text(data.length);
        },
        error: function (result, statut, err) {
        },
        complete: function (result, statut, err) {
        }
    });
}

function getAndFixLimits(filtre) {
    $.ajax({
        type:'POST',
        url: 'collectElm.php',
        async: false,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: JSON.stringify(filtre),
        success: function(dataString){

            var data = JSON.parse(dataString);

            if(data.length > 0){
                $('#limitDepart').html('Limite(s) du départ : ');

                data.forEach(function (t) {
                    var limit = document.createElement('i');
                    $(limit).text(t.nom).addClass('badge badge-pill badge-info text-monospace').appendTo('#limitDepart');
                });
            }
            else $('#limitDepart').html('Limite(s) du départ : <i class="font-weight-bold">Aucunes limites</i>');


        },
        error: function (result, statut, err) {
            console.log('error limit')
        },
        complete: function (result, statut, err) {
        }
    });


}

function getAndFixPostes(filtre) {

var energDexAgenOnDpt = {
        'OUEST': {
            'pui': 0,
            'nbre': 0,
            'agences':{}
        },
        'EST': {
            'pui': 0,
            'nbre': 0,
            'agences':{}
        },
        'SUD': {
            'pui': 0,
            'nbre': 0,
            'agences':{}
        },
        'NORD': {
            'pui': 0,
            'nbre': 0,
            'agences':{}
        },
        'CENTRE': {
            'pui': 0,
            'nbre': 0,
            'agences':{}
        }
    },
     puiTotal = 0,
     nbreTotal = 0;

    /*  Obtention des infos et classification par Dex  */
    $.ajax({
        type:'POST',
        url: 'collectElm.php',
        async: false,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: JSON.stringify(filtre),
        success: function(dataString){

            var dataLocal = JSON.parse(dataString);

            nbreTotal = dataLocal.length;

            if(dataLocal.length > 0){
                dataLocal.forEach(function (t) {
                    puiTotal += parseFloat(t.powerPoste);

                    energDexAgenOnDpt[t.nomDex].pui += parseFloat(t.powerPoste);
                    energDexAgenOnDpt[t.nomDex].nbre += 1;

                    if(energDexAgenOnDpt[t.nomDex].agences[t.nomAgence]){
                        energDexAgenOnDpt[t.nomDex].agences[t.nomAgence].pui += parseFloat(t.powerPoste);
                        energDexAgenOnDpt[t.nomDex].agences[t.nomAgence].nbre += 1;
                    }
                    else{
                        energDexAgenOnDpt[t.nomDex].agences[t.nomAgence] = {
                            'pui': parseFloat(t.powerPoste),
                            'nbre': 1
                        } ;
                    }
                });
            }

            $.each(energDexAgenOnDpt, function (key, value) {

                var prcPuiDexString = '';

                if(puiTotal > 0)   prcPuiDexString = Math.round(value.pui*100/puiTotal) + '%';
                else  prcPuiDexString = '0%';

                $('thead').find('.' + key).text(prcPuiDexString);


                $('tbody').find('.' + key).html('');

                if(!jQuery.isEmptyObject(value.agences)){
                    console.log('ici là');
                    $.each(value.agences, function (key1, value1) {

                        $('tbody').find('.' + key).append('<p>Agence <strong>' + key1 + '</strong> : <strong>' + value1.nbre + '</strong> poste(s), <strong>' + value1.pui + '</strong> MW</p>');
                    });
                }else console.log('rien à faire');

            });

            var ctxB = document.getElementById('barChart').getContext('2d');
            var myBarChart = new Chart(ctxB, {
                type: 'bar',

                data: {
                    labels: ["Dex OUEST", "Dex EST", "Dex SUD", "Dex NORD", "Dex CENTRE"],
                    datasets: [{
                        label: 'Puissance Installée (MW)',
                        data: [
                            energDexAgenOnDpt.OUEST.pui,
                            energDexAgenOnDpt.EST.pui,
                            energDexAgenOnDpt.SUD.pui,
                            energDexAgenOnDpt.NORD.pui,
                            energDexAgenOnDpt.CENTRE.pui
                        ],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255,99,132,1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1,
                        hoverBorderColor: '#000',
                        hoverBorderWidth: 3
                    }]
                },

                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    },
                    title:{
                        display: true,
                        text: 'Quantité d\'énergie fournie à chaque Dex',
                        fontSize: 25
                    },
                    legend:{
                        display: true
                    }
                }
            });

            $('#nbrePostesDepart').text(nbreTotal);
            $('#puiDepart').text(puiTotal);
        },
        error: function (result, statut, err) {
        },
        complete: function (result, statut, err) {
        }
    });

    /*restitution des infos de la BD dans le rapport*/


}

function restituteRapport() {

    $.each(energDexAgenOnDpt, function (key, value) {

        var prcPuiDexString = '';

        if(puiTotal > 0)   prcPuiDexString = Math.round(value.pui*100/puiTotal) + '%';
        else  prcPuiDexString = '0%';

        $('thead').find('.' + key).text(prcPuiDexString);


        $('tbody').find('.' + key).html('');

        if(!jQuery.isEmptyObject(value.agences)){
            console.log('ici là');
            $.each(value.agences, function (key1, value1) {

                $('tbody').find(key).append('<p>Agences <strong>' + key1 + '</strong> : <strong>' + value1.nbre + '</strong> postes, <strong>' + value1.pui + '</strong> MW</p>');
            });
        }else console.log('rien à faire');

    });

    var ctxB = document.getElementById('barChart').getContext('2d');
    var myBarChart = new Chart(ctxB, {
        type: 'bar',

        data: {
            labels: ["Dex OUEST", "Dex EST", "Dex SUD", "Dex NORD", "Dex CENTRE"],
            datasets: [{
                label: 'Puissance Installée (MW)',
                data: [
                    energDexAgenOnDpt.OUEST.pui,
                    energDexAgenOnDpt.EST.pui,
                    energDexAgenOnDpt.SUD.pui,
                    energDexAgenOnDpt.NORD.pui,
                    energDexAgenOnDpt.CENTRE.pui
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1,
                hoverBorderColor: '#000',
                hoverBorderWidth: 3
            }]
        },

        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            title:{
                display: true,
                text: 'Quantité d\'énergie fournie à chaque Dex',
                fontSize: 25
            },
            legend:{
                display: true
            }
        }
    });
}