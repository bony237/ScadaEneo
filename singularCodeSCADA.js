/*
*    L'API "PDF JS" permet la lecture d'un PDF. Ce programme créé un dynamisme qui exploite l'affichage du doc PDF ainsi il est agrippé
*    au dessus du viewer un calque interactif.
 */

var page1 = null,                                                    // schéma de carte à suivre
    calque = document.createElement('div'),                          // création du calque (vide) interactif
    elmToTrack = document.getElementById('viewer'),                  // parent de section PDF à traquer pour assurer la cohérence du calque avec le PDF cartographique
    elmToShut = document.getElementById('sidebarToggle'),            // élement ayant été comme embarrassant et dont l'existance est contraint par l'API "PDF JS"
    widthCalque = 0,                                                 // attention à ces 02 variables, elles ne proviennent pas réellement du css de l'élement |#calque|
    heightCalque = 0;

const pctWidthElmPoste = (70/15748)*100,                            // cte du rapport voulue entre "width" element par rapport au calque (l'élement |poste| et |OCR Départ| ont les mêmes valeurs)
    pctHeightElmPoste = (70/7875)*100,                           // cte du rapport voulue entre "height" element par rapport au calque (l'élement |poste| et |OCR Départ| ont les mêmes valeurs)
    pctWidthElmOCR = (40/15748)*100,
    pctHeightElmOCR = (40/7875)*100;


calque.id = 'calque';                                     // id à donner au calque interactif
calque.style.all = 'inherit';                             // obtenir l'ensemble des propriétés  génerales de .canvasWrapper | suffisant pour assurer l'option recheche du pdf viewer
calque.style.position = 'absolute';                       // s'assurer du positionnement absolu du calque
calque.style.top = '0px';                                 // observation : sans ce positionnement à 0, le calque se met en dessous du 1st elm (#page1) de .canvasWrapper
calque.style.left = '0px';
calque.style.zIndex = '3';                                // s'assurer du positionnement du calque au dessus de tout --ce raisonnement  doit être revisité dans le cadre de l'indexage des élements enfants


/*calque.style.width = page1.style.width;                 // conflit empêchant le fonctionnement de l'option recherche du pdf viewer --Attention à ne pas le prendre en compte !!
calque.style.height = page1.style.height;*/


var observerPdf = new MutationObserver(function (mutationList) {            // tracker les mutations DOM de l'élement #viewer

    try{
        mutationList.forEach(function(mutation){

            if(mutation.target.className === 'textLayer'){              // cette mutation signalée, on en déduit que la mutation précédente (#page1) s'est effectuée avec succès

                page1 = document.getElementById('page1');               // recupération de l'élement |#page1|

                page1.parentNode.appendChild(calque);                   // ajout du calque dans le DOM, plus précisement au parent de l'élement |#page1|

                widthCalque = parseFloat(page1.style.width);            // valeurs réelles attribuées à ces variables et supposées valeurs de l'élement |#calque|
                heightCalque = parseFloat(page1.style.height);

                calque.style.fontSize = ((pctWidthElmPoste*parseFloat(page1.style.width))/40) + '%';     //calcul et fixation dans css d'une variable servant au font size

                if(elmToShut.classList.contains('toggled')){
                    var event = new MouseEvent('click', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });

                    elmToShut.dispatchEvent(event);           // simulation d'un event click pour enlever l'apparition génante d'un élement (apparition ordonnée par un fichier JS difficile d'accès)
                }

                getAllElms();                           // fonction appel de la BD et pour intégration des élements dans le calque


                throw BreakException;
            }
        });
    } catch (e){
        if(e !== BreakException)  throw e;

    }

});

observerPdf.observe(elmToTrack, {
    childList: true,                                      // track de l'apparition d'élements enfants
    subtree: true                                         // track active même au niveau des élements enfants eux mêmes
});
/* fin du tracking*/


/*
*   Dynamisme de l'application web
*
* */


var isEdit = false,                                                     // état du mode edit (sommes nous en mode edit ?)
    isCommand = true,                                                   // état du mode command (sommes nous en mode command ?)
    isDia = false,                                                      // état du bloc de dialogue (la boîte de dialogue est-elle ouverte  ?)
    trace = null,                                                       // stockage de l'élement en cours d'utilisation dans la boîte de dialogue
    neighbours = [],                                                    // variables des voisins de l'élements en cours (en supposant l'attribution des voisins très aléatoires, il est ainsi préférable une variable de travail indépendante)
    neighboursMvt = {                                                   // historique sans redondance des actes entrepris durant le travail d'attribution de voisins (ces actes doivent être effectué de manière reciproque chez l'élement voisin)
        'add':[],                                                       // action 'add neighbours'
        'del':[]                                                        // action 'delete neighbours'
    },
    viewer = document.getElementById('viewerContainer'),                 // bloc pdf à dépacer pour donner de l'espace à la boîte de dialogue
    saveClassAddToElm = {                                                // historique des actes d'attribution de classes dans le but de revenir à la normale le moment venu
        'evidenceParent':[],
        'evidenceChild':[],
        'elmToUpdate':[],
        'neighbour':[]
    },
    formEdit = document.querySelector('#editDialog form'),                 // formulaire EDITION
    formCommand  = document.querySelector('#commandDialog form'),          // formulaire COMMANDE
    commandHasChange = false,                                              // (y'a t'il eu une tentative de modification des données de l'élement ?) en mode command
    editHasChange = false,                                                 // (y'a t'il eu une tentative de modification des données de l'élement ?) en mode edit
    goUrl = '',                                                            // URL de la requête (la plus part des requêtes serveur ont la même structure et sont donc géré par la même fonction, mais differe d'url server)
    submission = {                                                         // données soumises, suivant le formulaire certaines données n'existeront pas ou seront vides
        /*
        'percXY': [],
        'targetId': '',
        'neighboursOk': [],
        'typeElm': '',
        'departInstall': '',
        'departActuel': '',
        'ordre': '',
        'formPoste': '',
        'powerPoste': '',
        'nom': '',
        'code': '',
        'nomAgence': '',
        'nomDex': '',
        'location': '',
        'theCommand': '',
        'commentaireCommand': ''*/
    };


/*Configurations initiales*/
(function () {

    formCommand.reset();                                                     // réinitialiser les deux formulaires par prudence
    formEdit.reset();
    $('#editDialog').hide();                                                 // cacher le formmulaire d'édition au debut de fonctionnement de l'app
    $('#commandDialog').show();                                              // découvrir le formmulaire de commande au debut de fonctionnement de l'app
    $('#parentDialogue').hide();                                             // cacher la section dialogue (parent des formulaire command et edit) au debut de fonctionnement de l'app
    viewer.className = 'supprMove';                                          // cette classe permet de rendre au bloc pdf 100% de l'espace de l'écran

})();


/* Code structure de l'automatisation de la boîte dialogue*/

$('#navBtnShow').popover({
    html: true,
    content : function(){
        return $('#popover-content').html();
    }
});                                           // configuration de l'animation popover de la barre de navigation


$(document).on('click', '#navBtnHide', function () {
    if (isDia) {
        if (isCommand) {
            if(commandHasChange)    beforeWhatToDo('permissionMode');             // and decide what to do
            else thingsToDo['changeMode']();
        } else if (isEdit) {
            if(editHasChange)   beforeWhatToDo('alert');                          // and decide what to do
            else  thingsToDo['changeMode']();
        }
    } else {
        thingsToDo['changeMode']();
    }
});                //  changement du mode à travers la barre de navigation


$('#normalCloseDia').click(function () {
    if(editHasChange || commandHasChange)   beforeWhatToDo('permissionClose');
    else   thingsToDo['closeDia']();
});                            //  bouton fermer (avec vérification de changement)


/* Possibilité de modifier ou de supprimer un élement (cette possibilité existe dès lors que "modifyElm" est l'action en cours)
* */

$('#supprModifDiaEdit').find('.modifyElm').click(function () {
    $('#neigbhours').parent().siblings().show(700);
    $('#supprModifDiaEdit').hide();

});      // décision de modifier l'élement en cours

$('#supprModifDiaEdit').find('.deleteElm').click(function () {
    deleteElmProccess(trace.id);                                          // processus de suppression de l'élement (client side, server side, influence on neighbours)

});      // décision de supprimer l'élement en cours



$('[name = "typeElm"]').click(function () {                               // déclenchable par click sur l'input ayant l'attribut name = 'typeElm'

    if(goUrl === 'setElm.php')    submission.theCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
    else submission.theCommand = 'closeOCR';                                      // supposition de la valeur par défaut d'un élement OCR dont la valeur |theCommand| n'est attribuable qu'en mode command

    if( $('#elmOCRDepart').is(':checked')){                               // elmOCRDepart est l'élement coché

        $('#departInstall').prop('required',true).parent().show();        // la valeur |depart| est visible et obligatoire
        submission.typeElm = $('#elmOCRDepart').val();

        $('#powFormPoste').hide().find('input').prop('required',false);   // les autres valeurs |powerPoste|, |formPoste| ne sont plus visibles, ni obligatoires et elles sont vides
        $('#powFormPoste').find(':radio').prop('checked',false);
        $('#powerPoste').val('');

        submission.powerPoste = '';
        submission.formPoste = '';
    }
    else if($('#elmPosteChoix').is(':checked')){                           // elmPoste est l'élement coché

        $('#powFormPoste').show().find('input').prop('required',true);     // les valeurs |formPoste|, |powerPoste| sont visibles et obligatoires --ici le code est en collaboration avec le html pour agir sur les 02 inputs |formPoste| et |powerPoste|
        submission.typeElm = $('#elmPosteChoix').val();

        $('#departInstall').prop('required',false).parent().hide();        // la valeur |depart| et |theCommand| n'est plus visible, ni obligatoire et elle est vide
        $('#departInstall').val('');

        submission.departInstall = '';
        submission.theCommand = '';
    }
    else {                                                                  // elmOCR ou elmOCRIACM est l'élement coché

        if($('#elmOCRChoix').is(':checked'))  submission.typeElm = $('#elmOCRChoix').val();
        else    submission.typeElm = $('#elmIACMChoix').val();

        $('#departInstall').prop('required',false).parent().hide();         // les autres valeurs |depart|, |powerPoste|, |formPoste| ne sont plus visibles, ni obligatoires et elles sont vides
        $('#departInstall').val('');

        $('#powFormPoste').hide().find('input').prop('required',false);
        $('#powFormPoste').find(':radio').prop('checked',false);
        $('#powerPoste').val('');

        submission.powerPoste = '';
        submission.formPoste = '';
        submission.departInstall = '';
    }

});                         // interactions possibles sur le bloc d'élement |typeElement| (en mode edit), déduction de données tels que |departInstall|, |formPoste|, |powerPoste| et supposition d'autre données |theCommand|. --les suppositions sont mises en evidence après



$('#editDialog').find('input').focus(function () {                         // se déclenche si le focus est acquis par un input du formEdit
    if(trace !== null)    editHasChange = true;
    console.log('focus over ' + $(this).attr('name'));
});                 // informer au minimum d'une intention de changement dans les inputs de editDialog


$('#commandDialog').find('input').focus(function () {                    // se déclenche si le focus est acquis par un input du formCommand
    if(trace !== null)    commandHasChange = true;
    //console.log('focus over ' + $(this).attr('name'));
});              // informer au minimum d'une intention de changement dans les inputs de commandDialog


$('#commandDialog').find('textarea').change(function () {               // se déclenche si un changement du |commentaire| est réalisé dans le formCommand
    if(trace !== null)    commandHasChange = true;
});             // informer du changement de l'input |commentaire| de commandDialog


var thingsToDo;
thingsToDo = {

    'commandElmOCR': function (e) {

        formCommand.reset();
        supprClassAddedElm();                         // suppression (par prudence) de l'effet visuel appliqué aux précedents élements
        trace = e.target;
        trace.classList.add('evidenceParent');
        saveClassAddToElm['evidenceParent'].push(trace.id);

        restituteInfosOCRCommand(trace.id);           // restituer les infos de l'élement OCR (etat_pin, dptActuel, commentaires précédents, avalNbrePoste, avalPuiPoste)

        if(isDia)   $('#parentDialogue').fadeOut('fast');       // donner l'impression d'une fermeture de la boîte de dialogue
        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        submission.targetId = trace.id;

        goUrl = 'setElm.php';
    },                                    // série d'action lors de la commande d'un OCR

    'selectORunselectNeighbour': function (e) {

        $('#editDialog form').show(700);
        $('#supprModifDiaEdit').hide();
        editHasChange = true;

        var numNeigh = neighbours.indexOf(e.target.id),
            numAddNeigh = neighboursMvt.add.indexOf(e.target.id),
            numDelNeigh = neighboursMvt.del.indexOf(e.target.id);

        if(numNeigh < 0){                                                   // l'element cliqué a été sélectionné

            neighbours.push(e.target.id);                                   // add to table neighbours
            e.target.classList.add('neighbour');

            if(numDelNeigh > 0) neighboursMvt.del.splice(numNeigh,1);
            else if(numAddNeigh < 0) neighboursMvt.add.push(e.target.id);

        }else{                                                              // l'element cliqué a été désélectionné

            neighbours.splice(numNeigh,1);                                  // delete from table neighbours
            e.target.classList.remove('neighbour');

            if(numAddNeigh > 0) neighboursMvt.add.splice(numNeigh,1);
            else if(numDelNeigh < 0) neighboursMvt.del.push(e.target.id);

        }

        $('#neigbhours').html('');
        neighbours.forEach(function (t) {
            if(t !== ''){
                var neighActPrint = document.createElement('li');
                $(neighActPrint).text($('#' + t).find('+ ul').find('.nom').text()).appendTo('#neigbhours');
            }
        });

        saveClassAddToElm['neighbour'] = neighbours;
        submission.neighboursOk = neighbours;

    },      // série d'action lors du travail d'attribution de voisins à un elm

    'modifyElm': function (e) {

        formEdit.reset();
        supprClassAddedElm();
        trace = e.target;
        trace.classList.add('elmToUpdate');
        saveClassAddToElm['elmToUpdate'].push(trace.id);

        $('#departInstall').parent().hide();
        $('#powFormPoste').hide();

        restituteInfosEdit(trace);                                  // restituer les infos de l'élement ([neighbours], formEdit, records)

        $('#optionEditTitle').text('Modification');
        $('#optionEditSubmit').val('Modifier');
        $('#supprModifDiaEdit').show();                            // possibilité de supprimer ou modifier l'élement
        $('#neigbhours').parent().siblings().hide();

        $('#record').show();

        if(isDia)   $('#parentDialogue').fadeOut('fast');
        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        submission.targetId = trace.id;

        goUrl = 'setElm.php';
    },                      // série d'action lors de la modification d'un elm

    'createElm': function (e) {

        formEdit.reset();
        supprClassAddedElm();
        $('#departInstall').parent().hide();
        $('#powFormPoste').hide();

        $('#optionEditTitle').text('Création');
        $('#optionEditSubmit').val('Créer');
        $('#supprModifDiaEdit').hide().find('+ form').show();       //hide supprim possibility

        $('#record').hide();                                        // hide the section save data

        if(isDia)   $('#parentDialogue').fadeOut('fast');
        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        submission.percXY = [e.offsetX, e.offsetY];

        goUrl = 'insertElm.php';
    },                      // série d'action lors de la création d'un elm

    'changeMode': function () {

        thingsToDo['closeDia']();

        isEdit = !isEdit;
        isCommand = !isCommand;
        if (isEdit) {
            $('#commandDialog').hide();
            formEdit.reset();
            $('#editDialog').show();
        }
        if (isCommand) {
            $('#editDialog').hide();
            formCommand.reset();
            $('#commandDialog').show();
        }

        var c_show = $('#navBtnShow').text(),
            c_hide = $('#navBtnHide').text();

        $('#navBtnShow').text(c_hide);
        calque.className = c_hide;
        $('#navBtnHide').text(c_show);
    },                      // série d'action lors du changement de mode --besoin important pour permettre sur la même interface une initiative de conception du réseau et de commande du réseau

    'closeDia': function () {

        supprClassAddedElm();
        trace = null;
        submission = {};
        neighbours = [];
        neighboursMvt = {
            'add':[],
            'del':[]
        };
        goUrl = '';
        isDia = false;
        formCommand.reset();                                                    // réinitialiser les deux formulaires .. doit être avant editHasChange parce que
        formEdit.reset();                                                       // l'évenement ('input').change() est tjrs actif
        editHasChange = false;
        commandHasChange = false;
        $('#parentDialogue').hide(500);
        viewer.className = 'supprMove';

    },                           // marque de fin d'un traitement important (il se matérialise par une initialisation des variables globales, remise à defaut de l'apparence de l'interface)

    'nothing': function () {

    }                          // fonction vide

};

function whatToDo(e, code){
    var elmOCR = e.target.classList.contains('OCR'),
        calque = (e.target.id === 'calque');


    switch (code){
        case 'C' :
            if(!isDia && isCommand && elmOCR)   return 'commandElmOCR';

            if(isDia && !calque && e.target !== trace && isCommand && elmOCR){
                if(commandHasChange){
                    beforeWhatToDo('permissionOCR');
                    return 'nothing';
                }
                else return 'commandElmOCR';
            }

            if(isDia && !calque && e.target !== trace && isEdit) return 'selectORunselectNeighbour';

            break;

        case 'Db':
            if(isEdit && e.target !== trace){
                if(editHasChange){                // trace !== null est une prudence au fait que editHasChange puisse se déclenché
                    beforeWhatToDo('alert');
                    return 'nothing';
                }
                else{
                    if(calque)  return 'createElm';
                    else    return 'modifyElm'
                }
            }

            break;

        default:    return 'nothing';
    }
}

calque.addEventListener('click', function (e) {
    var doThis = whatToDo(e, 'C');
    thingsToDo[doThis](e);
}, false);

calque.addEventListener('dblclick', function (e) {
    var doThis = whatToDo(e, 'Db');
    thingsToDo[doThis](e);

}, false);


$('form').submit(function (event) {

    if($('#nom').val() !== '')   submission.nom = $('#nom').val();

    if($('#code').val() !== '')    submission.code = $('#code').val();


    if($('#nomAgence').val() !== '')  submission.nomAgence = $('#nomAgence').val();
    if($('#nomDex').val() !== '')    submission.nomDex = $('#nomDex').val();
    if($('#location').val() !== '')    submission.location = $('#location').val();

    if(!submission.typeElm){
        $('[name="typeElm"]').each(function () {

            if($(this).is(':checked'))  submission.typeElm = $(this).val();

        });
    }

    $('[name="formPoste"]').each(function () {

        if($(this).is(':checked'))  submission.formPoste = $(this).val();

    });

    if($('#powerPoste').val() !== '')    submission.powerPoste = $('#powerPoste').val();

    if(neighbours.length > 0)   submission.neighboursOk = neighbours;

    if(isCommand){
        $('[name="theCommand"]').each(function () {

            $('#' + submission.targetId).removeClass($(this).val());
            if($(this).is(':checked')){
                submission.theCommand = $(this).val();
                $('#' + submission.targetId).addClass($(this).val());

            }

        });

        if($('#commentaireCommand').val() !== '')    submission.commentaireCommand = $('#commentaireCommand').val();
    }

    /*if(isEdit && submission.theCommand === 'closeOCR' && goUrl === 'setElm.php'){
        submission.theCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
        if(submission.theCommand === '')  submission.theCommand = 'closeOCR';
    }*/


    if($('#departInstall').val() !== '') {
        submission.departInstall = $('#departInstall').val();
        submission.ordre = 'dpt';
    }

        /*Gestion d'influence de l'élement submit*/
    var resp = [];                                          // la réponse attendu est celle ordonnant la destruction de l'influence de l'élement sous ordre du parent
    if(!submission.typeElm){
        submission.theCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
        resp = manageInfluenceOf($('#' + submission.targetId).find('+ ul').find('.typeElm').text());
    }                    // quand lorsque l'utilisateur n'a pas ré-indiqué le type de l'élement
    else resp = manageInfluenceOf(submission.typeElm);


    console.log(submission);

    insertORsetElm(submission, false);

    if(resp.length > 0){}

    event.preventDefault();

});


function beforeWhatToDo(type) {

    if(type === 'alert'){
        $('#modalHeader').html("<h2>Attention</h2>");
        $('#modalBody').html("<p class='font-weight-bold'>Veuillez terminer l'édition de l'élement actuel !</p>");
        $('#modalFooter').html("<button id='okBtn' type='button' class='btn btn-danger btn-block'>OK</button>");

        $('#customModal').modal('show');
        $('#okBtn').click(function () {
            $('#customModal').modal('hide');
            //Do nothing else
        });
    }

    if(type === 'permissionMode' || type === 'permissionOCR' || type === 'permissionClose'){
        $('#modalHeader').html("<h2 class='text-success'>Attention</h2>");
        $('#modalBody').html("<p>Vos changements n'ont pas été sauvegardés, êtes vous sûr de vouloir continuer ?</p>");
        $('#modalFooter').html("<button id='backBtn' type='button' class='btn btn-light font-weight-bold'>Revenir</button> " +
            " <button id='continueBtn' type='button' class='btn btn-dark'>Continuer</button>");

        $('#customModal').modal('show');

        $('#backBtn').click(function () {
            $('#customModal').modal('hide');
        });
        $('#continueBtn').click(function () {
            $('#customModal').modal('hide');
            if(type === 'permissionMode')   thingsToDo['changeMode']();
            else if(type === 'permissionOCR')    thingsToDo['commandElmOCR']();
            else thingsToDo['closeDia']();
        });
    }

}


function supprClassAddedElm() {

    $.each( saveClassAddToElm, function (theClass, theIds) {
        if(theIds.length > 0){
            theIds.forEach(function (t) {
                if(t !== '')    $('#' + t).removeClass(theClass);
            });
        }
    });

    saveClassAddToElm = {
        'evidenceParent':[],
        'evidenceChild':[],
        'elmToUpdate':[],
        'neighbour':[]
    };

}

function influenceStructureNeighbour(traceId) {

    var submissionDeElmCall = {};

    if(neighboursMvt.add.length > 0){
        neighboursMvt.add.forEach(function (t) {
            var voisinsDeElmCall = $('#' + t).find('+ ul').find('.neighboursOk').text();

            if(voisinsDeElmCall === '') voisinsDeElmCall = [];
            else  voisinsDeElmCall = voisinsDeElmCall.split(';');
            voisinsDeElmCall.push(traceId);

            submissionDeElmCall.targetId = t;
            submissionDeElmCall.neighboursOk = voisinsDeElmCall;
            insertORsetElm(submissionDeElmCall, true);

            $('#' + t).find('+ ul').find('.neighboursOk').text(voisinsDeElmCall.join(';'));

            // influencer les voisins (cas de OCRDepart)
            // se faire influencer par voisins et influencer voisins petits (cas de OCR)
            // se faire influencer par voisins (cas de poste)

        });
    }

    if(neighboursMvt.del.length > 0){
        neighboursMvt.del.forEach(function (t){
            var voisinsDeElmCall = $('#' + t).find('+ ul').find('.neighboursOk').text();

            if(voisinsDeElmCall === '') voisinsDeElmCall = [];
            else  voisinsDeElmCall = voisinsDeElmCall.split(';');

            var num = voisinsDeElmCall.indexOf(traceId);
            voisinsDeElmCall.splice(num,1);

            submissionDeElmCall.targetId = t;
            submissionDeElmCall.neighboursOk = voisinsDeElmCall;
            insertORsetElm(submissionDeElmCall,true);

            $('#' + t).find('+ ul').find('.neighboursOk').text(voisinsDeElmCall.join(';'));
        });
    }

}

function destroyStructureInfluenceOf(idElm, onIdsNeighbours) {

    var submissionDeElmCall = {};
    onIdsNeighbours.forEach(function (t){
        var voisinsDeElmCall = $('#' + t).find('+ ul').find('.neighboursOk').text();

        if(voisinsDeElmCall === '') voisinsDeElmCall = [];                                               // inutile, ils sont déjà voisins et confirmés
        else  voisinsDeElmCall = voisinsDeElmCall.split(';');

        var num = voisinsDeElmCall.indexOf(idElm);
        voisinsDeElmCall.splice(num,1);

        submissionDeElmCall.targetId = t;
        submissionDeElmCall.neighboursOk = voisinsDeElmCall;
        insertORsetElm(submissionDeElmCall,true);

        $('#' + t).find('+ ul').find('.neighboursOk').text(voisinsDeElmCall.join(';'));
    });
}



function restituteInfosEdit(targetElmToEdit) {

    // restituer les voisins de l'élement à editer
    var neighboursText = $('#' + targetElmToEdit.id).find('+ ul').find('.neighboursOk').text();
    if(neighboursText === '') neighbours = [];
    else  neighbours = neighboursText.split(';');

    neighbours.forEach(function (voisinId) {
        if(voisinId !== '')   $('#' + voisinId).addClass('neighbour');
    });
    saveClassAddToElm['neighbour'] = neighbours;

    if(neighbours.length > 0){
        $('#neigbhours').html('');
        neighbours.forEach(function (t) {
            if(t !== ''){
                var neighActPrint = document.createElement('li');
                $(neighActPrint).text($('#' + t).find('+ ul').find('.nom').text()).appendTo('#neigbhours');
            }
        });
    }



    // restituer les infos (records) de la bte de dialogue (pas de class list..., )

    var infosAll = $('#' + targetElmToEdit.id).find('+ ul').html();

    $('#record').find('ul').html(infosAll).find('li').removeClass('list-group-item p-2');

    // restituer le formulaire edit

    $('#editDialog').find('input').each(function () {
        var nomInput = $(this).attr('name'),
            valBd = $('#' + targetElmToEdit.id).find('+ ul').find('.' + nomInput).text();


        if(valBd !== ''){
            if(nomInput === 'typeElm'){
                if(valBd === 'elmPoste')    $('#powFormPoste').show();
                if(valBd === 'elmOCRDepart')    $('#departInstall').parent().show();
                //alert(valBd);
                $('[value =' + valBd + ']').prop('checked', true);
            }else if(nomInput === 'formPoste')    $('[value =' + valBd + ']').prop('checked', true);
            else   $(this).val(valBd);
        }
    });

}

function restituteInfosOCRCommand(targetElmToCommand) {
    var nomElmToCommand = $('#' + targetElmToCommand).find('+ ul').find('.nom').text(),
        theCommandLocal = $('#' + targetElmToCommand).find('+ ul').find('.theCommand').text();

    $('#nomOCR').text(nomElmToCommand);
    $('[value =' + theCommandLocal + ']').prop('checked', true);

}


function insertORsetElm(submissionLocal, alreadyInfluence) {

    var goUrlLocal = goUrl;
    if(submissionLocal.targetId && submissionLocal.targetId !== '') goUrlLocal = 'setElm.php';

    $.ajax({
        type:'POST',
        url: goUrlLocal,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: JSON.stringify(submissionLocal),
        success: function(newId){

            if(goUrlLocal === 'insertElm.php'){
                createElmProcess(newId, submissionLocal);
                influenceStructureNeighbour(newId);
            }
            if(goUrlLocal === 'setElm.php') {
                updateElmProcess(submissionLocal);
                if(!alreadyInfluence)  influenceStructureNeighbour(submissionLocal.targetId);

            }

            thingsToDo['closeDia']();

        },
        error: function (result, statut, err) {
            console.log('Problems');
            console.log(statut);
        },
        complete: function (result, statut, err) {
            console.log('complete');
            console.log(statut);
        }
    });
}

function getAllElms() {                                 //get add create all the posteElm
    $.get("getElm.php", function(data){

        var allElmsOfBd = JSON.parse(data);

        if(allElmsOfBd.length > 0){
            allElmsOfBd.forEach(function (elmOfBd) {
                var idElm = elmOfBd._id['$oid'];

                delete elmOfBd._id;
                createElmProcess(idElm, elmOfBd);
                //console.log(idElm);
            });
        }

    });

}

function deleteElmProccess(idElm) {

    $.ajax({
        type:'POST',
        url: 'deleteElm.php',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: idElm,
        success: function(data){
            var onIdsNeighbours = $('#' + idElm ).find('+ ul').find('.neighboursOk').text();

            if(onIdsNeighbours !== ''){
                onIdsNeighbours = onIdsNeighbours.split(';');
                destroyStructureInfluenceOf(idElm, onIdsNeighbours);
            }

            $('#'+ idElm ).parent().remove();
            thingsToDo['closeDia']();
        },
        error: function (result, statut, err) {
            console.log('Problems');
            console.log(statut);
        },
        complete: function (result, statut, err) {
            console.log('complete');
            console.log(statut);
        }
    });


}

function createElmProcess(newId, submissionCreer) {

    var heightElm = '',
        widthElm = '',
        leftElm = '',
        topElm = '',
        zIndexParentElm = '',
        divParent = document.createElement('div'),
        elm = document.createElement('div'),
        infos = document.createElement('ul');

    if (submissionCreer.typeElm === 'elmPoste'){
        heightElm = pctHeightElmPoste + '%';
        widthElm = pctWidthElmPoste + '%';
        zIndexParentElm = '1';

        $(elm).addClass('poste');
        if(submissionCreer.formPoste === 'rond') $(elm).addClass('rond');
        else $(elm).addClass('carre');

        leftElm = (submissionCreer.percXY[0]*100/widthCalque - pctWidthElmPoste/2) + '%';
        topElm = (submissionCreer.percXY[1]*100/heightCalque - pctHeightElmPoste/2) + '%';

    }else {
        zIndexParentElm = '2';
        if(submissionCreer.typeElm === 'elmOCRDepart'){
            heightElm = pctHeightElmPoste + '%';
            widthElm = pctWidthElmPoste + '%';

            leftElm = (submissionCreer.percXY[0]*100/widthCalque - pctWidthElmPoste/2) + '%';
            topElm = (submissionCreer.percXY[1]*100/heightCalque - pctHeightElmPoste/2) + '%';
        }else{
            heightElm = pctHeightElmOCR + '%';
            widthElm = pctWidthElmOCR + '%';

            leftElm = (submissionCreer.percXY[0]*100/widthCalque - pctWidthElmOCR/2) + '%';
            topElm = (submissionCreer.percXY[1]*100/heightCalque - pctHeightElmOCR/2) + '%';
        }

        $(elm).addClass('OCR');

        if(submissionCreer.theCommand !== 'closeOCR')  $(elm).addClass(submissionCreer.theCommand);
    }



    if(submissionCreer.neighboursOk) submissionCreer.neighboursOk = submissionCreer.neighboursOk.join(';');


    $(divParent).css({'font-size': 'inherit', 'position':'absolute', 'left':leftElm, 'top':topElm, 'width':widthElm, 'height':heightElm, 'z-index':zIndexParentElm}).appendTo('#calque');

    $(elm).css({'font-size': 'inherit', 'position':'absolute', 'left':'0', 'top':'0', 'width':'100%', 'height':'100%'})
        .attr({'data-placement':'bottom', 'data-toggle':'popover','title':'Element réseau', 'data-trigger':'hover', 'id':newId})
        .appendTo($(divParent));

    submissionCreer.percXY = submissionCreer.percXY.join(';');

    $(infos).html(
        '             <li class="list-group-item d-none p-2" >Nom : <i class="nom font-weight-bold text-info"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Type : <i class="typeElm font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Départ Actuel : <i class="departActuel font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Départ Installé : <i class="departInstall font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Puissance : <i class="powerPoste font-weight-bold"></i> MW</li>' +
        '             <li class="list-group-item d-none p-2" >Forme poste : <i class="formPoste font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Etat : <i class="theCommand font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Code : <i class="code font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Agence : <i class="nomAgence font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >DEX : <i class="nomDex font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Localisation : <i class="location font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Voisins : <i class="neighboursOk font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Ordre : <i class="ordre font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Coordonnée X et Y : <i class="percXY font-weight-bold"></i></li>'
    ).css('display','none').addClass('list-group').appendTo($(divParent));


    //$(divParent).appendTo('#calque');

    $.each( submissionCreer, function (key, value) {
        $(infos).find('i').each(function () {
            if($(this).hasClass(key)){
                $(this).text(value);
                $(this).parent().removeClass('d-none');

                if(value === '' || key === 'ordre' || key === 'neighboursOk' || key === 'percXY' || key === 'formPoste')    $(this).parent().addClass('d-none');
                //$(this).text(value).parent().removeClass('d-none');                         // pour le développement
            }
        });
    });


    $('#'+ newId).popover({
        html: true,
        content : function(){
            return $(this).find('+ ul').html();
        }
    });

}

function updateElmProcess(submissionUpdate) {

    if(submissionUpdate.typeElm){
        var heightElm = '',
            widthElm = '',
            leftElm = '',
            topElm = '',
            zIndexParentElm = '';

        var percXY = $('#' + submissionUpdate.targetId).find('+ ul').find('.percXY').text();
        percXY = percXY.split(';');

        document.getElementById(submissionUpdate.targetId).className = '';

        if (submissionUpdate.typeElm === 'elmPoste'){
            heightElm = pctHeightElmPoste + '%';
            widthElm = pctWidthElmPoste + '%';
            zIndexParentElm = '1';

            leftElm = ((parseFloat(percXY[0]))*100/widthCalque - pctWidthElmPoste/2) + '%';
            topElm = ((parseFloat(percXY[1]))*100/heightCalque - pctHeightElmPoste/2) + '%';

            $('#' + submissionUpdate.targetId).addClass('poste');
            if(submissionUpdate.formPoste === 'rond') $('#' + submissionUpdate.targetId).addClass('rond');
            else $('#' + submissionUpdate.targetId).addClass('carre');

        }else {
            zIndexParentElm = '2';
            if(submissionUpdate.typeElm === 'elmOCRDepart'){
                heightElm = pctHeightElmPoste + '%';
                widthElm = pctWidthElmPoste + '%';

                leftElm = ((parseFloat(percXY[0]))*100/widthCalque - pctWidthElmPoste/2) + '%';
                topElm = ((parseFloat(percXY[1]))*100/heightCalque - pctHeightElmPoste/2) + '%';
            }else{
                heightElm = pctHeightElmOCR + '%';
                widthElm = pctWidthElmOCR + '%';

                leftElm = ((parseFloat(percXY[0]))*100/widthCalque - pctWidthElmOCR/2) + '%';
                topElm = ((parseFloat(percXY[1]))*100/heightCalque - pctHeightElmOCR/2) + '%';
            }

            $('#' + submissionUpdate.targetId).addClass('OCR');


            if(submissionUpdate.theCommand !== 'closeOCR')    $('#' + submissionUpdate.targetId).addClass(submissionUpdate.theCommand);
        }

        $('#' + submissionUpdate.targetId).parent().css({'font-size': 'inherit', 'position':'absolute', 'left':leftElm, 'top':topElm, 'width':widthElm, 'height':heightElm, 'z-index':zIndexParentElm});
    }



    if(submissionUpdate.neighboursOk) submissionUpdate.neighboursOk = submissionUpdate.neighboursOk.join(';');

    $.each( submissionUpdate, function (key, value) {
        $('#' + submissionUpdate.targetId).find('+ ul').find('i').each(function () {
            if($(this).hasClass(key)){
                $(this).text(value);
                $(this).parent().removeClass('d-none');

                if(value === '' || key === 'ordre' || key === 'neighboursOk' || key === 'percXY' || key === 'formPoste')    $(this).parent().addClass('d-none');
                //$(this).text(value).parent().removeClass('d-none');                         // pour le développement
            }
        });
    });

}


function manageInfluenceOf(typeToManage) {
    var resp = [];
    if (typeToManage === 'elmOCRDepart') {
// Départ installé |Influencor|
        var lastDepartInstall = '',
            lastCommand = '',
            lastTypeElm = '',
            lastNeighbours = '';

        if (submission.targetId) {
            lastDepartInstall = $('#' + submission.targetId).find('+ ul').find('.departInstall').text();
            lastCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
            lastTypeElm = $('#' + submission.targetId).find('+ ul').find('.typeElm').text();
            lastNeighbours = $('#' + submission.targetId).find('+ ul').find('.neighboursOk').text();
        }

        if (goUrl === 'insertElm.php' && submission.neighboursOk.length > 0) {    /* && submission.theCommand === 'closeOCR'*/
            // création de l' OCRDépart
            if(submission.theCommand === 'closeOCR'){
                influenceEnergyOrdreNeighbours(submission.departInstall, submission.ordre, submission.neighboursOk, '');
                submission.departActuel = submission.departInstall;
            }        // la création se fait toujours à OCR fermé
        }           // création du départ !!
        else if (lastDepartInstall !== submission.departInstall || neighboursMvt.del.length > 0 || neighboursMvt.add.length > 0) {
            // mutation (possible mvt des voisins)
            if (lastDepartInstall !== submission.departInstall) {

                if(lastTypeElm !== 'elmPoste')   destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);

                if (submission.theCommand === 'closeOCR'){
                    submission.departActuel = submission.departInstall;
                    influenceEnergyOrdreNeighbours(submission.departInstall, submission.ordre, submission.neighboursOk, '');
                }   // influencer ses voisins
                else if(lastTypeElm !== 'elmOCRDepart'){
                    submission.departActuel = $('#' + submission.targetId).find('+ ul').find('.typeElm').text();
                }     // s'assigner le statut départ actuel selon son ancienne nature
                else submission.departActuel = submission.departInstall;        // assignation dans le cas ou la nature ancienne était un OCRDepart

            } else {
                if (neighboursMvt.del.length > 0) {
                    destroyInfluenceEnergyOrdreNeighbours(submission.targetId, neighboursMvt.del);
                }
                if (neighboursMvt.add.length > 0) {
                    if(submission.theCommand === 'closeOCR')  influenceEnergyOrdreNeighbours(submission.departInstall, submission.ordre, neighboursMvt.add, '');
                    else {
                        neighboursMvt.add.forEach(function (neighbourId) {
                            var isOCR = ($('#' + neighbourId).find('+ ul').find('.typeElm').text() !== 'elmPoste'),
                                isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                                dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text(),
                                ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                            if(isOCR && isClose && dptVoisin !== ''){
                                resp.push({
                                    'action': 'add',
                                    'data': [dptVoisin, ordreVoisin, submission.targetId, neighbourId]
                                });
                            }
                        });     //  recherche parmi les élements de la nouvelle configuration,
                                                                                     // des voisins pouvant profiter de l'occasion pour influencer l'OCR
                    }
                }
            }

        }       // mutation de OCRDépart ou Mvt Voisins
        else if (isCommand && !((lastCommand === 'closeOCR' && submission.theCommand === 'closeOCR') || (lastCommand !== 'closeOCR' && submission.theCommand !== 'closeOCR'))) {
            // commande de l'OCRDepart
            if (submission.theCommand === 'closeOCR') influenceEnergyOrdreNeighbours(submission.departInstall, submission.ordre, lastNeighbours, submission.targetId);
            else destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);
        }   // commande normale d'un OCRDépart


    } // Départ installé |Influencor|
    else if(typeToManage !== 'elmPoste') {
// OCR ou IACM |Influencor|

        var departActuel = '',                                          // départ déjà présent sur l'élement
            lastCommand = '',                                           // commande (OCR) déjà réalisé sur l'élement
            lastOrdre = '',                                             // ordre déjà présent sur
            lastTypeElm = '',
            lastNeighbours = '';

        if (submission.targetId) {
            departActuel = $('#' + submission.targetId).find('+ ul').find('.departActuel').text();
            lastCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
            lastOrdre = $('#' + submission.targetId).find('+ ul').find('.ordre').text();
            lastTypeElm = $('#' + submission.targetId).find('+ ul').find('.typeElm').text();
            lastNeighbours = $('#' + submission.targetId).find('+ ul').find('.neighboursOk').text();

        }

        if (goUrl === 'insertElm.php' && submission.neighboursOk.length > 0) {    /* && submission.theCommand === 'closeOCR'*/
// création de l'OCR ou IACM
            submission.departActuel = '';
            submission.ordre = '';

            var nbreDptVoisin = 0,
                departs = [],
                ordres = [],
                nbreOCRs = [];

            submission.neighboursOk.forEach(function (neighbourId) {
                var isOCR = ($('#' + neighbourId).find('+ ul').find('.typeElm').text() !== 'elmPoste'),
                    isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                    dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text(),
                    voisinsVoisin = $('#' + neighbourId).find('+ ul').find('.neighboursOk').text(),             // String
                    ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();


                if (voisinsVoisin !== '') voisinsVoisin.split(';');                     // []

                if (isOCR && isClose && dptVoisin !== '' && voisinsVoisin !== '') {

                    var countOCR = 1;
                    voisinsVoisin.forEach(function (t) {
                        if ($('#' + t).find('+ ul').find('.typeElm').text() !== 'elmPoste')  countOCR++;                          // il ne peut pas me compter car je n'ai pas encore été set
                    });


                    ordres.push(ordreVoisin);
                    departs.push(dptVoisin);
                    nbreOCRs.push(countOCR);

                    nbreDptVoisin++;

                    /*voisinChild = submission.neighboursOk;
                    var num = voisinChild.indexOf(neighbourId);
                    voisinChild.splice(num, 1);*/

                }
            });         // déterminer le départ et l'ordre parent à prendre en compte pour l'OCR créé

            if(nbreDptVoisin > 1){
                var dptParent = delChildInThis(departs, ordres, nbreOCRs);
                departs = dptParent.departs;
                ordres = dptParent.ordres;
                nbreOCRs = dptParent.nbreOCRs;
                nbreDptVoisin = departs.length;
            }               // scinder les départs enfants des départs parents et reduire la grandeur du tableau [departs]

            if (nbreDptVoisin === 1) {
                submission.departActuel = departs[0];
                submission.ordre = ordres[0] + '.' + String(nbreOCRs[0]);
                if(submission.theCommand === 'closeOCR'){
                    var voisinsChilds = neighbours.ok;

                    submission.neighboursOk.forEach(function (voisin) {
                        var voisinDpt = $('#' + voisin).find('+ ul').find('.departActuel').text(),
                            voisinOrdre1 = $('#' + voisin).find('+ ul').find('.ordre').text(),
                            voisinOrdre2 = voisinOrdre1.slice(0, -2);

                        if(voisinDpt === departs[0] && (voisinOrdre1 === ordres[0] || voisinOrdre2 === ordres[0])){                                                       // même départ
                            num = voisinsChilds.indexOf(voisin);
                            voisinsChilds.splice(num, 1);
                        }
                    });        // extraire les elements parents et frères du donneur d'ordre


                    if(voisinsChilds.length > 0)    influenceEnergyOrdreNeighbours(submission.departActuel, submission.ordre, voisinsChilds, '');
                }         // ne pas influencer mon parent
            }           // 01 départ parent trouvé
            else if (nbreDptVoisin > 1) {
                submission.theCommand = 'green';
                submission.departActuel = departs[0] + ';' + departs[1];
                submission.ordre = ordres[0] + '.' + String(nbreOCRs[0]) + ';' + ordres[1] + '.' + String(nbreOCRs[1]);
            }        //  02 départs parents trouvés

        }   // création de l'OCR ou IACM
        else if (lastTypeElm === 'elmPoste' || lastTypeElm === 'elmOCRDepart' || neighboursMvt.del.length > 0 || neighboursMvt.add.length > 0) {
// mutation (possible mvt des voisins)

            submission.departActuel = departActuel;
            submission.ordre = lastOrdre;

            if (lastTypeElm === 'elmOCRDepart'){
                destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);
                submission.ordre = '';
                submission.departActuel = '';
            }      // utiliser les configurations de l'ancien élement OCRDépart
            else if (lastTypeElm === 'elmPoste' && departActuel !== '') {

                (function() {            //ok
                    var getParentOrdre = lastOrdre,
                        countOCR = 1;

                    getParentOrdre.slice(0, -2);

                    lastNeighbours.forEach(function (neighbourId) {
                        var isLastDepart = ($('#' + neighbourId).find('+ ul').find('.departActuel').text() === departActuel),
                            isParentOrdre = ($('#' + neighbourId).find('+ ul').find('.ordre').text() === getParentOrdre);

                        if (isLastDepart && isParentOrdre) {
                            var parentNeighboursCountOCR = $('#' + neighbourId).find('+ ul').find('.neighboursOk').text();
                            parentNeighboursCountOCR.split(';');

                            parentNeighboursCountOCR.forEach(function (t) {
                                if ($('#' + t).find('+ ul').find('.typeElm').text() !== 'elmPoste') countOCR++;                          // il ne peut pas me compter car je n'ai pas encore été set
                            });
                        }
                    });     // déterminer le parent de l'ancien Poste pour construire la configuration du nouveau OCR

                    submission.departActuel = departActuel;
                    submission.ordre = getParentOrdre + '.' + String(countOCR);

// les voisins de l'ancienne configuration n'ont pas pu être influencé par un poste donc de même l'OCR créé doit être considéré comme un élement isolé juste
// un recepteur (non influencor) envers les voisins de son ancienne configuration !
                })();           // déduire le depart et le nouvel ordre de l'OCR muté depuis un Poste

                if (neighboursMvt.add.length > 0){
                    if(submission.theCommand === 'closeOCR'&& departActuel !== '')    influenceEnergyOrdreNeighbours(submission.departActuel, submission.ordre, neighboursMvt.add, submission.targetId);
                    else {
                        neighboursMvt.add.forEach(function (neighbourId) {
                            var isOCR = ($('#' + neighbourId).find('+ ul').find('.typeElm').text() !== 'elmPoste'),
                                isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                                dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text(),
                                ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                            if(isOCR && isClose && dptVoisin !== ''){
                                resp.push({
                                    'action': 'add',
                                    'data': [dptVoisin, ordreVoisin, submission.targetId, neighbourId]
                                });
                            }
                        });     //  recherche parmi les élements de la nouvelle configuration,
                                                                                    // des voisins pouvant profiter de l'occasion pour influencer l'OCR
                    }
                }

                if (neighboursMvt.del.length > 0 && departActuel !== ''){

                    destroyInfluenceEnergyOrdreNeighbours(submission.targetId, neighboursMvt.del);
                    neighboursMvt.del.forEach(function (t) {
                        if(t === isMyFather(submission.targetId).targetId){
                            //destroyInfluenceEnergyOrdreNeighbours(t, [submission.targetId]);
                            resp.parentDestroy = [t , submission.targetId];

                        }
                    });
                }   // entre elementOCR et donc ayant le même grade, la destruction se doit d'être reciproque surtout si le deal inclut le parent,
                // cependant il faut attendre que l'élement enfant écrit et termine ses requêtes avant de le détruire.

            }    // utiliser les configurations de l'ancien élement Poste
            else{

                if (neighboursMvt.del.length > 0 && departActuel !== ''){

                    destroyInfluenceEnergyOrdreNeighbours(submission.targetId, neighboursMvt.del);
                    neighboursMvt.del.forEach(function (t) {
                        if(t === isMyFather(submission.targetId).targetId){
                            resp.push({
                                'action': 'del',
                                'data': [t , submission.targetId]
                            });
                        }
                    });
                }

                if (neighboursMvt.add.length > 0){
                    if(submission.theCommand === 'closeOCR' && departActuel !== ''){
                        influenceEnergyOrdreNeighbours(submission.departActuel, submission.ordre, neighboursMvt.add, submission.targetId);
                    }else {
                        neighboursMvt.add.forEach(function (neighbourId) {
                            var isOCR = ($('#' + neighbourId).find('+ ul').find('.typeElm').text() !== 'elmPoste'),
                                isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                                dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text(),
                                ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                            if(isOCR && isClose && dptVoisin !== ''){
                                resp.push({
                                    'action': 'add',
                                    'data': [dptVoisin, ordreVoisin, submission.targetId, neighbourId]
                                });
                            }
                        });     //  recherche parmi les élements de la nouvelle configuration,
                                                                         // des voisins prêts à profiter de l'occasion pour influencer l'OCR
                    }
                }


            }   // mouvements sur les voisins de l'élement, sans départ(ancien départ) un ocr est juste vide mais peuvent être influencé par un nveau élement voisin
                                                // et ne peut influencer personne et il est inutile qu'il cherche à detruire un enfant car il n'en a pas
        }   // mutation (possible mvt des voisins)
        else if (departActuel !== ''&& isCommand && !((lastCommand === 'closeOCR' && submission.theCommand === 'closeOCR') || (lastCommand !== 'closeOCR' && submission.theCommand !== 'closeOCR'))) {
// commande de l'OCR OU IACM
            submission.departActuel = departActuel;
            submission.ordre = lastOrdre;

            if (submission.theCommand === 'closeOCR'){

                var voisinsChilds = $('#' + submission.targetId).find('+ ul').find('.neighboursOk').text(),           // String
                    papaElmOrdre = isMyFather(submission.targetId).ordre;

                if(voisinsChilds !== ''){
                    voisinsChilds = voisinsChilds.split(';');                                       // []

                    voisinsChilds.forEach(function (voisin) {
                        var voisinDpt = $('#' + voisin).find('+ ul').find('.departActuel').text(),
                            voisinOrdre1 = $('#' + voisin).find('+ ul').find('.ordre').text(),
                            voisinOrdre2 = voisinOrdre1.slice(0, -2);

                        if(voisinDpt === data.departActuel && (voisinOrdre1 === papaElmOrdre || voisinOrdre2 === papaElmOrdre)){                                                       // même départ
                            num = voisinsChilds.indexOf(voisin);
                            voisinsChilds.splice(num, 1);
                        }
                    });
                }else voisinsChilds = [];              // déterminer les voisins (non parent et non frères) à effectivement influencer

                if(voisinsChilds.length > 0 )   influenceEnergyOrdreNeighbours(submission.departActuel, submission.ordre, voisinsChilds, submission.targetId);

            }
            else destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);
        }   // commande de l'OCR OU IACM

    }   // OCR ou IACM |Influencor and Infuencable|
    else {
// élement Poste |influencable|


        var departActuel = '',                                          // départ déjà présent sur l'élement
            lastCommand = '',                                           // commande (OCR) déjà réalisé sur l'élement
            lastOrdre = '',                                             // ordre déjà présent sur
            lastTypeElm = '',
            lastNeighbours = '';

        if (submission.targetId) {
            departActuel = $('#' + submission.targetId).find('+ ul').find('.departActuel').text();
            lastCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
            lastOrdre = $('#' + submission.targetId).find('+ ul').find('.ordre').text();
            lastTypeElm = $('#' + submission.targetId).find('+ ul').find('.typeElm').text();
            lastNeighbours = $('#' + submission.targetId).find('+ ul').find('.neighboursOk').text();

        }

        if(goUrl === 'insertElm.php' && submission.neighboursOk.length > 0){

            submission.departActuel = '';
            submission.ordre = '';

            var nbreDptVoisin = 0,
                departs = [],
                ordres = [],
                nbreOCRs = [],
                elmsCall = [];

                submissionsInfluenced = [];

            submission.neighboursOk.forEach(function (neighbourId) {
                var isOCR = ($('#' + neighbourId).find('+ ul').find('.typeElm').text() !== 'elmPoste'),
                    isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                    dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text(),
                    voisinsVoisin = $('#' + neighbourId).find('+ ul').find('.neighboursOk').text(),             // String
                    ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();


                if (voisinsVoisin !== '') voisinsVoisin.split(';');                     // []

                if (isOCR && isClose && dptVoisin !== '' && voisinsVoisin !== '') {

                    var countOCR = 1;
                    voisinsVoisin.forEach(function (t) {
                        if ($('#' + t).find('+ ul').find('.typeElm').text() !== 'elmPoste')  countOCR++;                          // il ne peut pas me compter car je n'ai pas encore été set
                    });


                    ordres.push(ordreVoisin);
                    departs.push(dptVoisin);
                    nbreOCRs.push(countOCR);
                    elmsCall.push(neighbourId);

                    nbreDptVoisin = departs.length;

                }
            });         // déterminer le départ et l'ordre parent à prendre en compte pour l'OCR créé

            if(nbreDptVoisin > 1){
                var dptParent = delChildInThis(departs, ordres, nbreOCRs, elmsCall);
                departs = dptParent.departs;
                ordres = dptParent.ordres;
                nbreOCRs = dptParent.nbreOCRs;

                nbreDptVoisin = departs.length;
            }

            while(nbreDptVoisin > 1){

                destroyInfluenceEnergyOrdreNeighbours(elmsCall[0], []);

                submissionsInfluenced.push({
                    'theCommand': 'green',
                    'targetId': elmsCall[0],
                    'departActuel': departs[0] + ';' + departs[nbreDptVoisin - 1],
                    'ordre': ordres[0] + ';' + ordres[nbreDptVoisin - 1] + '.' + String(nbreOCRs[nbreDptVoisin - 1])
                });

                elmsCall.pop();

                nbreDptVoisin = departs.length;
            }



            if (nbreDptVoisin === 1) {
                submission.departActuel = departs[0];
                submission.ordre = ordres[0] + '.P'  ;

            }           // 01 départ parent trouvé

            /*else if (nbreDptVoisin > 1) {
                submission.theCommand = 'green';
                submission.departActuel = departs[0] + ';' + departs[1];
                submission.ordre = ordres[0] + '.' + String(nbreOCRs[0]) + ';' + ordres[1] + '.' + String(nbreOCRs[1]);
            }        //  02 départs parents trouvés*/

        }   // création du Poste


        else if(lastTypeElm !== submission.typeElm || neighboursMvt.del.length > 0 || neighboursMvt.add.length > 0){
            //destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);

            if (neighboursMvt.del.length > 0 && departActuel !== ''){

                destroyInfluenceEnergyOrdreNeighbours(submission.targetId, neighboursMvt.del);
                neighboursMvt.del.forEach(function (t) {
                    if(t === isMyFather(submission.targetId).targetId){
                        resp.parentDestroy = [t , submission.targetId];
                    }
                });
            }

            if (neighboursMvt.add.length > 0){
                neighboursMvt.add.forEach(function (neighbourId) {
                    var isOCR = ($('#' + neighbourId).find('+ ul').find('.typeElm').text() !== 'elmPoste'),
                        isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                        dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text(),
                        ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                    if(isOCR && isClose && dptVoisin !== ''){
                        resp.push({
                            'action': 'add',
                            'data': [dptVoisin, ordreVoisin, submission.targetId, neighbourId]
                        });
                    }
                });     //  recherche parmi les élements de la nouvelle configuration,
                                                                             // des voisins pouvant profiter de l'occasion pour influencer le Poste
            }


        }   // mutation vers poste
    }   // Poste |Influencable|


    return resp;
}


function influenceEnergyOrdreNeighbours(dptParent, ordreParent, voisinsElmId, idOfParent) {
    /*var elmType = '',                                                   // type de l'élement à influencer
        elmCommand = '',                                                // commande de l'élement à influencer
        lastDptActuel = '',
        lastOrdre = '',
        voisins = '',
        indOrdre = 0,
        dptInstall = '';*/
    /*  dptParent : départ à transmettre aux élements influencés
    *   ordreParent : ordre de classification relayé aux élements influencés
    *   voisinsElmId : élements à influencer
    *   idOfParent : reférence de l'élement ayant appelé la fonction (donneur d'ordre)
    * */

    var indOrdre = 0,                                                                           // Ordre de classification à attribuer aux élements OCR influencés
        toInfluenced = [];

//par Hypothèse un élément à influencer n'a soit pas de départ (lastDpt = ''), ou il n'a qu'un départ (lastDpt = 'jujiok')

    voisinsElmId.forEach(function (idVoisin) {                                                  // boucle sur chaque élement à influencer
        if(idVoisin !== ''){
            var submissionInfluenced = {},                                                                  // enregistrement les modifications faites aux élements réseaux
                elmType = $('#' + idVoisin).find('+ ul').find('.typeElm').text(),                           // type de l'élement influencé
                elmCommand = $('#' + idVoisin).find('+ ul').find('.theCommand').text(),                     // status de l'élement influencé (ouvert : pas de transmission, fermer : tranmettre)
                lastDptActuelText = $('#' + idVoisin).find('+ ul').find('.departActuel').text(),            // départ(s) actuellement présent(s) sur l'OCR à influencer

                lastOrdreText = $('#' + idVoisin).find('+ ul').find('.ordre').text();                       // ordre(s) actuellement présent(s) sur l'OCR à influencer


            if(elmType === 'elmOCRDepart')  lastDptActuelText = $('#' + idVoisin).find('+ ul').find('.departInstall').text();


            if(elmType !== 'elmPoste'){                                 // element OCR (ocrPoste, IACM, ocrDépart)

                indOrdre++;

                if(lastDptActuelText === '' && elmType !== 'elmOCRDepart'){

                    console.log('transmission de l\'énergie');

                    submissionInfluenced = {
                        'targetId': idVoisin,
                        'departActuel': dptParent,
                        'ordre': ordreParent + '.' + String(indOrdre)
                    };

                    insertORsetElm(submissionInfluenced, true);

                    if(elmCommand === 'closeOCR')  toInfluenced.push(submissionInfluenced);
                }       // élement n'ayant aucun départ (actuel)

                if(lastDptActuelText !== '' || elmType === 'elmOCRDepart'){

                    var commandAssign = elmCommand,
                        idToCommand = idVoisin,
                        dptAssign = '';

                    if(elmCommand === 'closeOCR'){
                        commandAssign = 'green';
                        dptAssign = lastDptActuelText + ';' + dptParent;

                        if(lastDptActuelText === dptParent && elmType !== 'elmOCRDepart'){
                            idToCommand = idOfParent;
                            console.log('bouclage sur le même départ détecté' + dptParent + ' et réglé au point' + idToCommand);
                            destroyInfluenceEnergyOrdreNeighbours(idToCommand, []);
                        }
                        else{
                            idToCommand = idVoisin;
                            console.log('bouclage des départs ' + lastDptActuelText + ' et ' + dptParent + ' détecté et réglé au point' + idToCommand);
                            destroyInfluenceEnergyOrdreNeighbours(idToCommand, []);
                        }

                    }

                    submissionInfluenced = {
                        'theCommand': commandAssign,
                        'targetId': idToCommand,
                        'departActuel': dptAssign,
                        'ordre': lastOrdreText + ';' + ordreParent + '.' + String(indOrdre)
                    };
                    insertORsetElm(submissionInfluenced, true);
                }       // élement (ocr) ayant déja un départ (actuel ou installé)

            }       // element OCR (ocrPoste, IACM, ocrDépart)
            else {         //if(elmType === 'OCRPoste')
                if(lastDptActuelText !== dptParent){
                    submissionInfluenced = {
                        'targetId': idVoisin,
                        'departActuel': dptParent,
                        'ordre': ordreParent + '.' + 'P'
                    };
                    insertORsetElm(submissionInfluenced, true);
                }

            }       // element poste à influencer

       }                    // l'élement doit être non-vide

    });                     // boucle sur chaque élement à influencer, determination de l'action futur à mener

// il est idéal d'avoir traité tous les elments enfants d'un parent avant d'aller influencer ses petit fils car ces derniers peuvent de manière erroné,
// influencer leurs ainés car ces derniers n'ayant pas encore été traité par la boucle.

    if(toInfluenced.length > 0){
        toInfluenced.forEach(function (data) {
            var voisinsChilds = $('#' + data.targetId).find('+ ul').find('.neighboursOk').text(),           // String
                papaElmOrdre = isMyFather(data.targetId).ordre;

            if(voisinsChilds !== ''){
                voisinsChilds = voisinsChilds.split(';');                                       // []

                voisinsChilds.forEach(function (voisin) {
                    var voisinDpt = $('#' + voisin).find('+ ul').find('.departActuel').text(),
                        voisinOrdre1 = $('#' + voisin).find('+ ul').find('.ordre').text(),
                        voisinOrdre2 = voisinOrdre1.slice(0, -2);

                    if(voisinDpt === data.departActuel && (voisinOrdre1 === papaElmOrdre || voisinOrdre2 === papaElmOrdre)){                                                       // même départ
                        num = voisinsChilds.indexOf(voisin);
                        voisinsChilds.splice(num, 1);
                    }
                });
            }else voisinsChilds = [];

            if(voisinsChilds.length > 0 )   influenceEnergyOrdreNeighbours(data.departActuel, data.ordre, voisinsChilds, data.targetId);
        });                         // boucle sur les actions futurs et fixation des voisins à effectivement influencer
    }       // règle1: un voisin est effectivement à influencer s'il n'est ni le père, ni un frère du donneur d'ordre


}


function destroyInfluenceEnergyOrdreNeighbours(idElmWork, connectToDel){

    var typeElmWork = $('#' + idElmWork).find('+ ul').find('.typeElm').text(),                               // type d'élement voulant détruire le lien avec ses enfants (donneur d'ordre)
        dpt = $('#' + idElmWork).find('+ ul').find('.departActuel').text(),                                  // départ conccerné (du donneur d'ordre)
        ordreDpt = $('#' + idElmWork).find('+ ul').find('.ordre').text(),                                    // Ordre parent du donneur d'ordre
        neighboursWork = $('#' + idElmWork).find('+ ul').find('.neighboursOk').text();           // String   // les voisins strucuturels du donneur d'ordre

    if(neighboursWork !== '')  neighboursWork.split(';');                                                              // []
    else neighboursWork = [];

    if(typeElmWork === 'elmOCRDepart'){
        dpt = $('#' + idElmWork).find('+ ul').find('.departInstall').text();                                 // cas de départ installé
        ordreDpt = 'dpt';                                                                                    // ordre universel d'un départ
    }

    if(connectToDel.length > 0) neighboursWork = connectToDel;


    if(neighboursWork.length > 0){

        neighboursWork.forEach(function (t) {
// recherche sur les voisins structurel des élements enfants du donneur d'ordre

            var submissionDestroyed = {},                                                                         // submission des destructions
                typeElmDestroy = $('#' + t).find('+ ul').find('.typeElm').text(),                                 // type de l'élement à analyser (pour destruction)
                commandElmDestroy = $('#' + t).find('+ ul').find('.theCommand').text(),                           // commande(OCR) de l'élement à analyser (pour destruction)
                dptElmDestroy = $('#' + t).find('+ ul').find('.departActuel').text(),               //String      // départ de l'élement à analyser (pour destruction)
                ordreElmDestroy = $('#' + t).find('+ ul').find('.ordre').text();                                  // ordre de l'élement à analyser (pour destruction)


            if (dptElmDestroy === '') {         // String to []
                dptElmDestroy = [];
                ordreElmDestroy = [];

                if(typeElmDestroy === 'elmOCRDepart')  dptElmDestroy = [$('#' + t).find('+ ul').find('.departInstall').text()];       // cas singulier d'un elément OCR départ à analyser

            } else{

                if(typeElmDestroy === 'elmOCRDepart')  dptElmDestroy = $('#' + t).find('+ ul').find('.departInstall').text() + ';' + dptElmDestroy;       // cas singulier d'un elément OCR départ à analyser

                dptElmDestroy = dptElmDestroy.split(';');
                ordreElmDestroy = ordreElmDestroy.split(';');
            }                           // String to []


            var num = dptElmDestroy.indexOf(dpt),                                   // vérification du statut départ concerné de l'élement analysé
                numOrdre = 96,                                                      // valeur erreur (en cas d'erreur de vérification)
                valDpt = ordreElmDestroy[0];

            if(valDpt.slice(0, -2) === ordreDpt){
                numOrdre = 0;
            } else{
                valDpt = ordreElmDestroy[1];
                if(valDpt.slice(0, -2) === ordreDpt) {
                    numOrdre = 1;
                }
            }                   // vérification du statut enfant de l'élement analysé


            if(dptElmDestroy.length === 1 && num > 0 && numOrdre === 0){            // un seul départ présent sur l'élement analysé

                submissionDestroyed = {
                    'targetId': t,
                    'departActuel': '',
                    'ordre': ''
                };

                if(typeElmDestroy !== 'elmPoste' && commandElmDestroy === 'closeOCR')   destroyInfluenceEnergyOrdreNeighbours(t, []);       // nouveau donneur d'ordre (ordre de destruction des petits enfants)

// il est important de donner d'abord l'ordre avant d'exécuter la destruction car cette derniere se reférera à des infos (départ, ordreDépart) du donneur d'ordre

                insertORsetElm(submissionDestroyed, true);

            }       // un seul départ présent sur l'élement analysé
            else if(dptElmDestroy.length === 2 && num > 0 && numOrdre === 1){                                               //petite garantie


                submissionDestroyed = {
                    'targetId': t,
                    'departActuel': dptElmDestroy[num],
                    'ordre': ordreElmDestroy[numOrdre]
                };

                insertORsetElm(submissionDestroyed, true);

            }   // deux départs présents sur l'élement analysé

        });                   // recherche sur les voisins structurel du donneur d'ordre, des élements enfants
    }         // règle2: la destruction s'effectue uniquement sur les enfants du donneur d'ordre

}

function isMyFather(idFils) {

    var getParentOrdre = $('#' + idFils).find('+ ul').find('.ordre').text(),
        departActuel = $('#' + idFils).find('+ ul').find('.departActuel').text(),
        neighbours = $('#' + idFils).find('+ ul').find('.neighboursOk').text(),     // String
        papa = '',
        response = {};

    neighbours.split(';');                      // []
    getParentOrdre.slice(0, -2);

    neighbours.forEach(function (neighbourId) {
        var isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
            isLastDepart = ($('#' + neighbourId).find('+ ul').find('.departActuel').text() === departActuel),
            isParentOrdre = ($('#' + neighbourId).find('+ ul').find('.ordre').text() === getParentOrdre);

        if(isLastDepart && isParentOrdre && isClose){
            papa = neighbourId;
            response = {
                'targetId': papa,
                'depart': departActuel,
                'ordre': getParentOrdre
            };
        }
    });

    return response;
}

function delChildInThis(departs, ordres, nbreOCRs, elmsCall) {
    var num = [];
    for(var i = 0, N = departs.length; i < N; i++){

        for(var j = 0; j < N; j++){
            if(i === j || departs[i] !== departs[j]) continue;

            var ordre1 = ordres[i],
                ordre2 = ordres[j];

            if(ordre1.slice(0, -2) === ordres[j]){
                num.push(i);
            }
            else if(ordre2.slice(0, -2) === ordres[i]){
                num.push(j);
            }

        }
    }
    if(num.length > 0){
        num.forEach(function (t) {
            departs.splice(t, 1);
            ordres.splice(t, 1);
            nbreOCRs.splice(t,1);
            if(elmsCall.length > 0)  elmsCall.splice(t,1);
        })
    }


    return { 'departs':departs, 'ordres':ordres, 'nbreOCRs': nbreOCRs, 'elmsCall': elmsCall };
}





