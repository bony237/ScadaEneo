/*
*    L'API "PDF JS" permet la lecture d'un PDF. Ce programme créé un dynamisme qui exploite l'affichage du doc PDF ainsi il est agrippé
*    au dessus du viewer un calque interactif.
 */

var FIRST_MUTATION_DONE = false,                                     // après que la première aapparition de #page1 ait été faite
    page1 = null,                                                    // schéma de carte à suivre
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

                if(!FIRST_MUTATION_DONE){
                    getAllElms();
                    FIRST_MUTATION_DONE = true;
                }            // fonction appel de la BD et pour intégration des élements dans le calque


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
        'possibleNumChildsOCR' = '',
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
    //$('#editDialog').find('form').show(700);
    $('#supprModifDiaEdit').hide();

});      // décision de modifier l'élement en cours

$('#supprModifDiaEdit').find('.deleteElm').click(function () {
    deleteElmProccess(trace.id);                                          // processus de suppression de l'élement (client side, server side, influence on neighbours)

});      // décision de supprimer l'élement en cours



$('[name = "typeElm"]').click(function () {                               // déclenchable par click sur l'input ayant l'attribut name = 'typeElm'

    if(goUrl === 'setElm.php')    submission.theCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
    if(submission.theCommand === '' || goUrl === 'insertElm.php')    submission.theCommand = 'closeOCR';
                                          // supposition de la valeur par défaut d'un élement OCR dont la valeur |theCommand| n'est attribuable qu'en mode command

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
    //console.log('focus over ' + $(this).attr('name'));
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

        if(isDia)   $('#parentDialogue').fadeOut('fast');       // donner l'impression d'une fermeture de la boîte de dialogue
        formCommand.reset();
        supprClassAddedElm();                         // suppression (par prudence) de l'effet visuel appliqué aux précedents élements
        trace = e.target;
        trace.classList.add('evidenceParent');
        saveClassAddToElm['evidenceParent'].push(trace.id);


        restituteInfosOCRCommand(trace.id);           // restituer les infos de l'élement OCR (etat_pin, dptActuel, commentaires précédents, avalNbrePoste, avalPuiPoste)
        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        submission.targetId = trace.id;

        goUrl = 'setElm.php';
    },                                    // série d'action lors de la commande d'un OCR

    'selectORunselectNeighbour': function (e) {

        $('#neigbhours').parent().siblings().show(700);
        //$('#editDialog').find('form').show(700);
        $('#supprModifDiaEdit').hide();
        editHasChange = true;

        var numNeigh = neighbours.indexOf(e.target.id),
            numAddNeigh = neighboursMvt.add.indexOf(e.target.id),
            numDelNeigh = neighboursMvt.del.indexOf(e.target.id);

        if(numNeigh < 0){                                                   // l'element cliqué a été sélectionné

            neighbours.push(e.target.id);                                   // add to table neighbours
            e.target.classList.add('neighbour');

            if(numAddNeigh < 0){
                if(numDelNeigh < 0)   neighboursMvt.add.push(e.target.id);
                else neighboursMvt.del.splice(numDelNeigh,1);
            }

        }else{                                                              // l'element cliqué a été désélectionné

            neighbours.splice(numNeigh,1);                                  // delete from table neighbours
            e.target.classList.remove('neighbour');

            if(numDelNeigh < 0){
                if(numAddNeigh < 0)   neighboursMvt.del.push(e.target.id);
                else neighboursMvt.add.splice(numAddNeigh,1);
            }

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
        //$('#editDialog').find('form').hide();
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

        if(isDia){
            $('#parentDialogue').fadeOut('fast');
            $('#indicPos').remove();
        }

        createTheIndication(e.offsetX, e.offsetY);

        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        submission.percXY = [e.offsetX, e.offsetY];
        submission.ctePercXY = [widthCalque, heightCalque];

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
        $('#indicPos').remove();
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

        $('#neigbhours').html('<li class="text-danger"><i>Aucuns voisins !</i></li>');      // si en edit mode
        $('#comments').html('');                                    // si en command mode
        $('#neigbhours').parent().siblings().show();             // si l'action entreprise était la modification d'un élement

    },                           // marque de fin d'un traitement important (il se matérialise par une initialisation des variables globales, remise à defaut de l'apparence de l'interface)

    'nothing': function () {

    }                          // fonction vide

};

function whatToDo(e, code){
    var elmOCR = e.target.classList.contains('OCR'),
        calque = (e.target.id === 'calque'),
        indicPos = (e.target.id === 'indicPos');


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

            if(isDia && !calque && !indicPos && e.target !== trace && isEdit) return 'selectORunselectNeighbour';

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

    //  //  // initDptOdrPossVoisin(); \\ \\ \\
    var doThis = whatToDo(e, 'Db');
    thingsToDo[doThis](e);

}, false);


$('form').submit(function (event) {

    //console.log(neighboursMvt);

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
                if(submission.theCommand !== 'closeOCR')  $('#' + submission.targetId).addClass($(this).val());

            }

        });

        submission.commentaireCommand = $('#commentaireCommand').val();             // ne pas mettre de commentaire est aussi une infos
    }

    if(isEdit)   submission.departInstall = $('#departInstall').val();


    /*Gestion d'influence de l'élement submit*/
    var resp = [];                                          // la réponse attendu est celle ordonnant la destruction de l'influence de l'élement sous ordre du parent
    if(!submission.typeElm){
        if(isEdit){
            submission.theCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
        }
        var lastTypeElm = $('#' + submission.targetId).find('+ ul').find('.typeElm').text();
        resp = manageInfluenceOf(lastTypeElm);
    }                    // quand lorsque l'utilisateur n'a pas ré-indiqué le type de l'élement
    else resp = manageInfluenceOf(submission.typeElm);

    if(resp === 'stop'){
        beforeWhatToDo('noKill');
        $('#' + submission.targetId).addClass('green');
    }
    else {

        var theNewId = insertORsetElm(submission, goUrl);                        // theNewId existe seulement dans le cas de la création de l'élement

        //console.log(theNewId);

        if(resp[0].length > 0){
            resp[0].forEach(function (t) {
                destroyInfluenceEnergyOrdreNeighbours(t.idElmWork, t.connectToDel);
            });
        }

        if(resp[1].length > 0){

            resp[1].forEach(function (t) {
                if(t.voisinsElmId === 'please the new Id')  influenceEnergyOrdreNeighbours(t.dptParent, t.ordreParent, [theNewId], t.idOfParent);
                else if(t.idOfParent === 'please the new Id')   influenceEnergyOrdreNeighbours(t.dptParent, t.ordreParent, t.voisinsElmId, [theNewId]);
                else  influenceEnergyOrdreNeighbours(t.dptParent, t.ordreParent, t.voisinsElmId, t.idOfParent);
            });
        }

    }



    event.preventDefault();
    thingsToDo['closeDia']();

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

    if(type === 'noKill'){
        $('#modalHeader').html("<h2>Attention</h2>");
        $('#modalBody').html("<p class='font-weight-bold h5'>Une manoeuvre dangereuse a été stoppée !</p>");
        $('#modalFooter').html("<button id='okBtn' type='button' class='btn btn-danger btn-block font-weight-bold'>Compris</button>");

        $('#customModal').modal('show');
        $('#okBtn').click(function () {
            $('#customModal').modal('hide');
            //Do nothing else
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



    if(neighboursMvt.add.length > 0){
        neighboursMvt.add.forEach(function (t) {
            var submissionDeElmCall = {};
            var voisinsDeElmCall = $('#' + t).find('+ ul').find('.neighboursOk').text();

            if(voisinsDeElmCall === '') voisinsDeElmCall = [];
            else  voisinsDeElmCall = voisinsDeElmCall.split(';');
            voisinsDeElmCall.push(traceId);

            submissionDeElmCall.targetId = t;
            submissionDeElmCall.neighboursOk = voisinsDeElmCall;
            setElmAfterCalcul(submissionDeElmCall);

            //$('#' + t).find('+ ul').find('.neighboursOk').text(voisinsDeElmCall.join(';'));

            /*if(voisinsDeElmCall.length > 0)  $('#' + t).find('+ ul').find('.neighboursOk').text(voisinsDeElmCall.join(';'));
            else $('#' + t).find('+ ul').find('.neighboursOk').text('');*/          // utile uniquement en mode delete !

            // influencer les voisins (cas de OCRDepart)
            // se faire influencer par voisins et influencer voisins petits (cas de OCR)
            // se faire influencer par voisins (cas de poste)

        });
    }

    if(neighboursMvt.del.length > 0){
        neighboursMvt.del.forEach(function (t){
            var submissionDeElmCall = {};
            var voisinsDeElmCall = $('#' + t).find('+ ul').find('.neighboursOk').text();

            if(voisinsDeElmCall === '') voisinsDeElmCall = [];
            else  voisinsDeElmCall = voisinsDeElmCall.split(';');

            var num = voisinsDeElmCall.indexOf(traceId);
            if(num >= 0)    voisinsDeElmCall.splice(num,1);

            submissionDeElmCall.targetId = t;
            submissionDeElmCall.neighboursOk = voisinsDeElmCall;
            setElmAfterCalcul(submissionDeElmCall);

            /*if(voisinsDeElmCall.length > 0)  $('#' + t).find('+ ul').find('.neighboursOk').text(voisinsDeElmCall.join(';'));
            else $('#' + t).find('+ ul').find('.neighboursOk').text('');*/
        });
    }

}

function destroyStructureInfluenceOf(idElm, onIdsNeighbours) {


    onIdsNeighbours.forEach(function (t){
        var submissionDeElmCall = {};
        var voisinsDeElmCall = $('#' + t).find('+ ul').find('.neighboursOk').text();

        if(voisinsDeElmCall !== ''){
            voisinsDeElmCall = voisinsDeElmCall.split(';');

            var num = voisinsDeElmCall.indexOf(idElm);
            if(num >= 0) voisinsDeElmCall.splice(num, 1);

            submissionDeElmCall.targetId = t;
            submissionDeElmCall.neighboursOk = voisinsDeElmCall;

            console.log(submissionDeElmCall);
            setElmAfterCalcul(submissionDeElmCall);
            //$('#' + t).find('+ ul').find('.neighboursOk').text(voisinsDeElmCall.join(';'));
        }                                              // inutile, ils sont déjà voisins et confirmés
        //else voisinsDeElmCall = [];
    });
}



function restituteInfosEdit(targetElmToEdit) {

    // restituer les voisins de l'élement à editer
    var neighboursText = $('#' + targetElmToEdit.id).find('+ ul').find('.neighboursOk').text();
    if(neighboursText === '') neighbours = [];
    else{
        neighbours = neighboursText.split(';');

        $('#neigbhours').html('');

        neighbours.forEach(function (voisinId) {
            $('#' + voisinId).addClass('neighbour');

            saveClassAddToElm['neighbour'].push(voisinId);

            if(voisinId !== ''){
                var neighActPrint = document.createElement('li');
                $(neighActPrint).text($('#' + voisinId).find('+ ul').find('.nom').text()).appendTo('#neigbhours');
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

                $('[value =' + valBd + ']').prop('checked', true);
            }else if(nomInput === 'formPoste')    $('[value =' + valBd + ']').prop('checked', true);
            else   $(this).val(valBd);
        }
    });

    var nomDexRes = $('#' + targetElmToEdit.id).find('+ ul').find('.nomDex').text();
    $('select').find('[value =' + nomDexRes + ']').prop('selected', true);

}

function restituteInfosOCRCommand(idElmToCommand) {
    var nomElmToCommand = $('#' + idElmToCommand).find('+ ul').find('.nom').text(),
        typeElm = $('#' + idElmToCommand).find('+ ul').find('.typeElm').text(),
        departs = '',
        theCommandLocal = $('#' + idElmToCommand).find('+ ul').find('.theCommand').text(),
        lastComment = $('#' + idElmToCommand).find('+ ul').find('.commentaireCommand').text();


    if(typeElm === 'elmOCRDepart'){
        departs = $('#' + idElmToCommand).find('+ ul').find('.departInstall').text();
        ordres = 'dpt';
    }
    else{
        departs = $('#' + idElmToCommand).find('+ ul').find('.departActuel').text();
        ordres = $('#' + idElmToCommand).find('+ ul').find('.ordre').text();
    }


    if(departs !== ''){
        departs = departs.split(';');
        ordres = ordres.split(';');
        if(departs.length === 1){
            $('#departsOCR').html(departs[0]);
            if(theCommandLocal === 'closeOCR'){
                var infosAval = setToEvidencePostesChilds(departs[0], ordres[0]);
                $('#nbrePosteAval').text(infosAval.nbrePosteAval);
                $('#puiAval').text(infosAval.puiAval);
            }
            else {
                $('#nbrePosteAval').text('00');
                $('#puiAval').text('00');
            }

        }
        else if(departs.length === 2){

            $('#departsOCR').html(departs[0] + '<br> & <br>' + departs[1]);
            $('#nbrePosteAval').text('00');
            $('#puiAval').text('00');
        }
    }
    else{
        $('#departsOCR').text('Aucun Départ');
        $('#nbrePosteAval').text('00');
        $('#puiAval').text('00');
    }

    $('#nomOCR').text(nomElmToCommand);                                         // restitution du nom
    $('[value =' + theCommandLocal + ']').prop('checked', true);                // restitution de la derniere commande
    $('#comments').text(lastComment);                                           // restitution du dernier commentaire

}

function setToEvidencePostesChilds(departRef, ordreRef) {

    var submissionEvidence = {
        'departActuel': departRef,
        'ordre': { '$regex': '^'+ ordreRef + '.*p$' , '$options': 'i'}                //{ 'regex': '^'+ ordreRef + '.*p$', 'options': 'i' }
        },
        result = {};


    $.ajax({
        type:'POST',
        url: 'collectElm.php',
        async: false,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: JSON.stringify(submissionEvidence),
        success: function(elmsString){
            elms = JSON.parse(elmsString);
            console.log(elms);

            var nbrePosteAval = elms.length,
                puiAval = 0;

            if(nbrePosteAval > 0){
                elms.forEach(function (t) {

                    puiAval += parseFloat(t.powerPoste);
                    $('#' + t._id['$oid']).addClass('evidenceChild');
                    saveClassAddToElm['evidenceChild'].push(t._id['$oid']);
                });
            }

            console.log([nbrePosteAval, puiAval]);
            result = { 'nbrePosteAval': nbrePosteAval, 'puiAval': puiAval };

        },
        error: function (result, statut, err) {
            console.log('Problems');
        }
    });

    return result;
}


function insertORsetElm(submissionLocal, goUrlLocal) {
    var theNewId = false;
    //if(submissionLocal.targetId && submissionLocal.targetId !== '') goUrlLocal = 'setElm.php';

    $.ajax({
        type:'POST',
        url: goUrlLocal,
        async: false,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: JSON.stringify(submissionLocal),
        success: function(newId){

            if(goUrlLocal === 'insertElm.php'){
                createElmProcess(newId, submissionLocal);
                influenceStructureNeighbour(newId);
                theNewId = newId;

            }
            if(goUrlLocal === 'setElm.php') {
                //console.log('setElm');
                updateElmProcess(submissionLocal);
                influenceStructureNeighbour(submissionLocal.targetId);

            }

        },
        error: function (result, statut, err) {
            console.log('Problems');
            //console.log(statut);
        },
        complete: function (result, statut, err) {
            //console.log('complete');
            //console.log(statut);
        }
    });

    return theNewId;
}

function setElmAfterCalcul(submissionLocal) {

    $.ajax({
        type:'POST',
        url: 'setElm.php',
        async: false,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: JSON.stringify(submissionLocal),
        success: function(data){
            //console.log('success calcul');
            updateElmProcess(submissionLocal);
        },
        error: function (result, statut, err) {
            console.log('Problems');
            //console.log(statut);
        },
        complete: function (result, statut, err) {
            //console.log('complete');
            //console.log(statut);
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
        async: false,
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: idElm,
        success: function(data){
            var neighboursToDel = $('#' + idElm).find('+ ul').find('.neighboursOk').text(),
                commandOfTheElm = $('#' + idElm).find('+ ul').find('.theCommand').text();

            if(neighboursToDel !== ''){
                console.log('suppression des enfants...');
                neighboursToDel = neighboursToDel.split(';');
                destroyStructureInfluenceOf(idElm, neighboursToDel);
                if(commandOfTheElm === 'closeOCR')  destroyInfluenceEnergyOrdreNeighbours(idElm, []);
                refreshNumOCRSpecialDel(idElm);
            }
            //else neighboursToDel = [];

            thingsToDo['closeDia']();                       // doit être avant la suppression sur le DOM car l'id de l'élement est encore nécessaire pour la suppression de classe de mise en évidence
            $('#'+ idElm ).parent().remove();

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

        leftElm = (submissionCreer.percXY[0]*100/submissionCreer.ctePercXY[0] - pctWidthElmPoste/2) + '%';
        topElm = (submissionCreer.percXY[1]*100/submissionCreer.ctePercXY[1] - pctHeightElmPoste/2) + '%';

    }else {
        zIndexParentElm = '2';
        if(submissionCreer.typeElm === 'elmOCRDepart'){
            heightElm = pctHeightElmPoste + '%';
            widthElm = pctWidthElmPoste + '%';

            leftElm = (submissionCreer.percXY[0]*100/submissionCreer.ctePercXY[0] - pctWidthElmPoste/2) + '%';
            topElm = (submissionCreer.percXY[1]*100/submissionCreer.ctePercXY[1] - pctHeightElmPoste/2) + '%';
        }else{
            heightElm = pctHeightElmOCR + '%';
            widthElm = pctWidthElmOCR + '%';

            leftElm = (submissionCreer.percXY[0]*100/submissionCreer.ctePercXY[0] - pctWidthElmOCR/2) + '%';
            topElm = (submissionCreer.percXY[1]*100/submissionCreer.ctePercXY[1] - pctHeightElmOCR/2) + '%';
        }

        $(elm).addClass('OCR');

        if(submissionCreer.theCommand !== 'closeOCR')  $(elm).addClass(submissionCreer.theCommand);
    }


    //console.log('tableau' + submissionCreer.neighboursOk);

    if(submissionCreer.neighboursOk){
        if(submissionCreer.neighboursOk.length <= 0)   submissionCreer.neighboursOk = '';
        else submissionCreer.neighboursOk = submissionCreer.neighboursOk.join(';');
    }

    if(submissionCreer.possibleNumChildsOCR){
        if(submissionCreer.possibleNumChildsOCR.length > 0)     submissionCreer.possibleNumChildsOCR = submissionCreer.possibleNumChildsOCR.join(';');
        else submissionCreer.possibleNumChildsOCR = '';
    }


    $(divParent).css({'font-size': 'inherit', 'position':'absolute', 'left':leftElm, 'top':topElm, 'width':widthElm, 'height':heightElm, 'z-index':zIndexParentElm}).appendTo('#calque');

    $(elm).css({'font-size': 'inherit', 'position':'absolute', 'left':'0', 'top':'0', 'width':'100%', 'height':'100%'})
        .attr({'data-placement':'bottom', 'data-toggle':'popover','title':'Element réseau', 'data-trigger':'hover', 'id':newId})
        .appendTo($(divParent));

    submissionCreer.percXY = submissionCreer.percXY.join(';');
    submissionCreer.ctePercXY = submissionCreer.ctePercXY.join(';');

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
        '             <li class="list-group-item d-none p-2" >Num prochains voisins OCR : <i class="possibleNumChildsOCR font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Ordre : <i class="ordre font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Commentaires : <i class="commentaireCommand font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Coordonnée X et Y : <i class="percXY font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Réference des coordonnées X et Y : <i class="ctePercXY font-weight-bold"></i></li>'
    ).css('display','none').addClass('list-group').appendTo($(divParent));


    //$(divParent).appendTo('#calque');

    $.each( submissionCreer, function (key, value) {
        $(infos).find('i').each(function () {
            if($(this).hasClass(key)){
                $(this).text(value);
                $(this).parent().removeClass('d-none');

                var toHide = (value === '' || key === 'ordre' || key === 'neighboursOk' || key === 'percXY' || key === 'ctePercXY' || key === 'formPoste' || key === 'possibleNumChildsOCR' || key === 'commentaireCommand');
                if(toHide)    $(this).parent().addClass('d-none');
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

        var percXY = $('#' + submissionUpdate.targetId).find('+ ul').find('.percXY').text(),
            ctePercXY = $('#' + submissionUpdate.targetId).find('+ ul').find('.ctePercXY').text();
        if(percXY !== ''){
            percXY = percXY.split(';');
            ctePercXY = ctePercXY.split(';');
        }
        else{
            percXY = [];
            ctePercXY = [];
        }

        document.getElementById(submissionUpdate.targetId).className = '';

        if (submissionUpdate.typeElm === 'elmPoste'){
            heightElm = pctHeightElmPoste + '%';
            widthElm = pctWidthElmPoste + '%';
            zIndexParentElm = '1';

            leftElm = ((parseFloat(percXY[0]))*100/parseFloat(ctePercXY[0]) - pctWidthElmPoste/2) + '%';
            topElm = ((parseFloat(percXY[1]))*100/parseFloat(ctePercXY[1]) - pctHeightElmPoste/2) + '%';

            $('#' + submissionUpdate.targetId).addClass('poste');
            if(submissionUpdate.formPoste === 'rond') $('#' + submissionUpdate.targetId).addClass('rond');
            else $('#' + submissionUpdate.targetId).addClass('carre');

        }else {
            zIndexParentElm = '2';
            if(submissionUpdate.typeElm === 'elmOCRDepart'){
                heightElm = pctHeightElmPoste + '%';
                widthElm = pctWidthElmPoste + '%';

                leftElm = ((parseFloat(percXY[0]))*100/parseFloat(ctePercXY[0]) - pctWidthElmPoste/2) + '%';
                topElm = ((parseFloat(percXY[1]))*100/parseFloat(ctePercXY[1]) - pctHeightElmPoste/2) + '%';
            }else{
                heightElm = pctHeightElmOCR + '%';
                widthElm = pctWidthElmOCR + '%';

                leftElm = ((parseFloat(percXY[0]))*100/parseFloat(ctePercXY[0]) - pctWidthElmOCR/2) + '%';
                topElm = ((parseFloat(percXY[1]))*100/parseFloat(ctePercXY[1]) - pctHeightElmOCR/2) + '%';
            }

            $('#' + submissionUpdate.targetId).addClass('OCR');


            if(submissionUpdate.theCommand !== 'closeOCR')    $('#' + submissionUpdate.targetId).addClass(submissionUpdate.theCommand);
        }

        $('#' + submissionUpdate.targetId).parent().css({'font-size': 'inherit', 'position':'absolute', 'left':leftElm, 'top':topElm, 'width':widthElm, 'height':heightElm, 'z-index':zIndexParentElm});
    }
    else if(submissionUpdate.theCommand){
        if(submissionUpdate.theCommand !== 'closeOCR')  $('#' + submissionUpdate.targetId).addClass(submissionUpdate.theCommand);
        else {
            var actualCommand = $('#' + submissionUpdate.targetId).find('+ ul').find('.theCommand').text();
            $('#' + submissionUpdate.targetId).removeClass(actualCommand);
        }
    }



    if(submissionUpdate.neighboursOk){
        if(submissionUpdate.neighboursOk.length <= 0)   submissionUpdate.neighboursOk = '';
        else submissionUpdate.neighboursOk = submissionUpdate.neighboursOk.join(';');
    }

    if(submissionUpdate.possibleNumChildsOCR){
        if(submissionUpdate.possibleNumChildsOCR.length > 0)     submissionUpdate.possibleNumChildsOCR = submissionUpdate.possibleNumChildsOCR.join(';');
        else submissionUpdate.possibleNumChildsOCR = '';
    }


    $.each(submissionUpdate, function (key, value) {
        $('#' + submissionUpdate.targetId).find('+ ul').find('i').each(function () {
            if($(this).hasClass(key)){
                $(this).text(value);
                $(this).parent().removeClass('d-none');

                var toHide = (value === '' || key === 'ordre' || key === 'neighboursOk' || key === 'percXY' || key === 'ctePercXY' || key === 'formPoste' || key === 'possibleNumChildsOCR' || key === 'commentaireCommand');
                if(toHide)    $(this).parent().addClass('d-none');
                //$(this).text(value).parent().removeClass('d-none');                         // pour le développement
            }
        });
    });

}

function createTheIndication (setX, setY){

    var setXperc = (setX - 3)*100/widthCalque + '%',
        setYperc = (setY - 3)*100/heightCalque + '%';

    indicPos = document.createElement('i');
    indicPos.id = 'indicPos';
    $(indicPos).css({'position':'absolute', 'left':setXperc, 'top':setYperc, 'width':'6px', 'height':'6px', 'background-color': 'red', 'border-radius': '3px'}).appendTo($('#calque'));
}



function manageInfluenceOf(typeToManage) {
    console.log('type traité : ' + typeToManage);
    var respAdd = [],
        respDel = [];

    switch(typeToManage){
        case 'elmOCRDepart':
            var lastDepartInstall = '',
                lastCommand = '',
                lastOrdre = '',
                lastTypeElm = '',
                lastNeighbours = '',
                lastDepartActuel = '';


            if (submission.targetId) {
                lastDepartInstall = $('#' + submission.targetId).find('+ ul').find('.departInstall').text();
                lastCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
                lastTypeElm = $('#' + submission.targetId).find('+ ul').find('.typeElm').text();
                lastNeighbours = $('#' + submission.targetId).find('+ ul').find('.neighboursOk').text();
                lastDepartActuel = $('#' + submission.targetId).find('+ ul').find('.departActuel').text();
                lastOrdre = $('#' + submission.targetId).find('+ ul').find('.ordre').text();
            }

                //console.log([submission.theCommand, submission.neighboursOk]);

            if (goUrl === 'insertElm.php' /* && submission.neighboursOk.length > 0*/) {    /* && submission.theCommand === 'closeOCR'*/
                // création de l' OCRDépart

                submission.departActuel = submission.departInstall;
                submission.ordre = 'dpt';
                submission.possibleNumChildsOCR = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if(submission.neighboursOk && submission.theCommand === 'closeOCR'){
                    respAdd.push({
                        'dptParent': submission.departInstall,
                        'ordreParent': submission.ordre,
                        'voisinsElmId': submission.neighboursOk,
                        'idOfParent': 'please the new Id'
                    });
                    //influenceEnergyOrdreNeighbours(submission.departInstall, submission.ordre, submission.neighboursOk, '');
                }        // la création se fait toujours à OCR fermé
            }           // création du départ !! okay
            else if (goUrl === 'setElm.php' && ((submission.departInstall && submission.departInstall !== '') || neighboursMvt.del.length > 0 || neighboursMvt.add.length > 0)) {
                // mutation (possible mvt des voisins)

                if (lastDepartInstall !== submission.departInstall) {

                    if(lastTypeElm !== 'elmPoste')   destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);

                    if (submission.theCommand === 'closeOCR'){                      // submission.theCommand est égale à lastCommand

                        submission.departActuel = submission.departInstall;
                        submission.ordre = 'dpt';
                        if(submission.neighboursOk){
                            respAdd.push({
                                'dptParent': submission.departInstall,
                                'ordreParent': submission.ordre,
                                'voisinsElmId': submission.neighboursOk,
                                'idOfParent': submission.targetId
                            });
                        }
                    }   // influencer ses voisins
                    else if((lastTypeElm === 'elmOCRPoste' || lastTypeElm === 'elmOCRIACM') && lastDepartActuel !== ''){

                        submission.departActuel = submission.departActuel + ';' + lastDepartActuel;
                        submission.ordre = 'dpt;' + lastOrdre;
                    }     // s'assigner le statut départ actuel selon son ancienne nature
                    else{
                        submission.departActuel = submission.departInstall;
                        submission.ordre = 'dpt';
                    }        // assignation dans le cas ou la nature ancienne était un OCRDepart

                } else {

                    if (neighboursMvt.del.length > 0) {
                        destroyInfluenceEnergyOrdreNeighbours(submission.targetId, neighboursMvt.del);
                    }
                    if (neighboursMvt.add.length > 0) {

                        if(lastCommand === 'closeOCR')  influenceEnergyOrdreNeighbours(lastDepartInstall, 'dpt', neighboursMvt.add, submission.targetId);
                        else {
                            neighboursMvt.add.forEach(function (neighbourId) {
                                var typeElm = $('#' + neighbourId).find('+ ul').find('.typeElm').text(),
                                    commandVoisin = $('#' + neighbourId).find('+ ul').find('.theCommand').text(),
                                    dptVoisin = '',
                                    ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                                if(typeElm === 'elmOCRDepart')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departInstall').text();
                                else if (typeElm === 'elmOCRPoste' || typeElm === 'elmOCRIACM')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text();

                                if(typeElm !== 'elmPoste' && commandVoisin === 'closeOCR' && dptVoisin !== '' && dptVoisin !== lastDepartInstall){

                                    var countOCR = numOCRChoix(neighbourId);

                                    submission.departActuel = lastDepartInstall + ';' + dptVoisin;
                                    submission.ordre = lastOrdre + ';' + ordreVoisin + '.' + countOCR;
                                }
                            });     //  recherche parmi les élements de la nouvelle configuration,
                            // des voisins pouvant profiter de l'occasion pour influencer l'OCR

                        }
                    }
                }

            }       // mutation de OCRDépart ou Mvt Voisins
            else if (isCommand && lastNeighbours !== '' && !((lastCommand === 'closeOCR' && submission.theCommand === 'closeOCR') || (lastCommand !== 'closeOCR' && submission.theCommand !== 'closeOCR'))) {
                // commande de l'OCRDepart

                lastNeighbours = lastNeighbours.split(';');

                if (submission.theCommand === 'closeOCR') influenceEnergyOrdreNeighbours(lastDepartInstall, 'dpt', lastNeighbours, submission.targetId);
                else destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);
            }   // commande normale d'un OCRDépart

            break;

        case 'elmPoste':
            var departActuel = '',                                          // départ déjà présent sur l'élement
                lastOrdre = '',                                             // ordre déjà présent sur
                lastTypeElm = '',
                lastNeighbours = '';

            if (submission.targetId) {
                departActuel = $('#' + submission.targetId).find('+ ul').find('.departActuel').text();
                lastOrdre = $('#' + submission.targetId).find('+ ul').find('.ordre').text();
                lastTypeElm = $('#' + submission.targetId).find('+ ul').find('.typeElm').text();
                lastNeighbours = $('#' + submission.targetId).find('+ ul').find('.neighboursOk').text();
            }

            if(goUrl === 'insertElm.php'){

                submission.departActuel = '';
                submission.ordre = '';
                submission.possibleNumChildsOCR = [];

                if(submission.neighboursOk && submission.neighboursOk.length > 0){

                    //console.log('recherche du papa');

                    var departs = [],
                        ordres = [],
                        nbreOCRs = [],
                        elmsCall = [];

                    submission.neighboursOk.forEach(function (neighbourId) {

                        var dptVoisin = '',
                            typeElm = $('#' + neighbourId).find('+ ul').find('.typeElm').text(),
                            lastCommand = $('#' + neighbourId).find('+ ul').find('.theCommand').text(),
                            ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                        if(typeElm === 'elmOCRDepart')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departInstall').text();
                        else if (typeElm === 'elmOCRPoste' || typeElm === 'elmOCRIACM')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text();



                        if (typeElm !== 'elmPoste' && lastCommand === 'closeOCR' && dptVoisin !== '') {

                            ordres.push(ordreVoisin);
                            departs.push(dptVoisin);
                            nbreOCRs.push(1);                                   // ce nombre est inutile dans le cas d'un poste
                            elmsCall.push(neighbourId);
                        }
                    });         // déterminer le départ et l'ordre parent à prendre en compte pour l'OCR créé

                    if(departs.length > 0){
                        var dptParent = delChildInThis(departs, ordres, nbreOCRs, elmsCall);
                        departs = dptParent.departs;
                        ordres = dptParent.ordres;
                        elmsCall = dptParent.elmsCall;

                        respAdd.push({
                            'dptParent': departs[0],
                            'ordreParent': ordres[0],
                            'voisinsElmId': 'please the new Id',
                            'idOfParent': elmsCall[0]
                        });

                    }               // scinder les départs enfants des départs parents et reduire la grandeur du tableau [departs]

                }


            }   // création du Poste

            else if(goUrl === 'setElm.php' && (lastTypeElm !== submission.typeElm || neighboursMvt.del.length > 0 || neighboursMvt.add.length > 0)){

                /*submission.departActuel = '';
                submission.ordre = '';*/

                if(lastTypeElm === 'elmOCRDepart'){
                    destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);
                    submission.ordre = '';
                    submission.departActuel = '';
                }
                else if(lastTypeElm !== 'elmPoste' && departActuel !== ''){
                    submission.departActuel = '';
                    submission.ordre = '';
                    (function() {            //ok
                        var getParentOrdre = lastOrdre.slice(0, -2);


                        lastNeighbours.forEach(function (neighbourId) {
                            var isLastDepart = ($('#' + neighbourId).find('+ ul').find('.departActuel').text() === departActuel),
                                isParentOrdre = ($('#' + neighbourId).find('+ ul').find('.ordre').text() === getParentOrdre);

                            if (isLastDepart && isParentOrdre) {

                                submission.departActuel = '';
                                submission.ordre = '';

                                respAdd.push({
                                    'dptParent': departActuel,
                                    'ordreParent': getParentOrdre,
                                    'voisinsElmId': [submission.targetId],
                                    'idOfParent': neighbourId
                                });

                            }
                        });     // déterminer le parent de l'ancien Poste pour construire la configuration du nouveau OCR
                        /* les voisins de l'ancienne configuration n'ont pas pu être influencé par un poste donc de même l'OCR créé doit être considéré comme un élement isolé juste
                        // un recepteur (non influencor) envers les voisins de son ancienne configuration !*/
                    })();
                }
                else if(neighboursMvt.del.length > 0 || neighboursMvt.add.length > 0){

                    if (neighboursMvt.del.length > 0 && departActuel !== ''){
                        neighboursMvt.del.forEach(function (t) {
                            if(t === isMyFather(submission.targetId).targetId){
                                destroyInfluenceEnergyOrdreNeighbours(t, [submission.targetId]);
                            }
                        });
                    }

                    if (neighboursMvt.add.length > 0){
                        neighboursMvt.add.forEach(function (neighbourId) {
                            var dptVoisin = '',
                                typeElm = $('#' + neighbourId).find('+ ul').find('.typeElm').text(),
                                isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                                ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                            if(typeElm === 'elmOCRDepart')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departInstall').text();
                            else if (typeElm === 'elmOCRPoste' || typeElm === 'elmOCRIACM')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text();

                            if(typeElm !== 'elmPoste' && isClose && dptVoisin !== ''){

                                influenceEnergyOrdreNeighbours(dptVoisin, ordreVoisin, [submission.targetId], neighbourId);
                            }
                        });     //  recherche parmi les élements de la nouvelle configuration,
                        // des voisins pouvant profiter de l'occasion pour influencer le Poste
                    }
                }

            }   // mutation vers poste

            break;

        default:    // 'elmOCRPoste' ou 'elmOCRIACM' //
            var departActuel = '',                                          // départ déjà présent sur l'élement
                lastCommand = '',                                           // commande (OCR) déjà réalisé sur l'élement
                lastOrdre = '',                                             // ordre déjà présent sur
                lastTypeElm = '',
                lastNeighbours = '',
                departInstall = '';

            if (submission.targetId) {
                departActuel = $('#' + submission.targetId).find('+ ul').find('.departActuel').text();
                lastCommand = $('#' + submission.targetId).find('+ ul').find('.theCommand').text();
                lastOrdre = $('#' + submission.targetId).find('+ ul').find('.ordre').text();
                lastTypeElm = $('#' + submission.targetId).find('+ ul').find('.typeElm').text();
                lastNeighbours = $('#' + submission.targetId).find('+ ul').find('.neighboursOk').text();
                departInstall = $('#' + submission.targetId).find('+ ul').find('.departInstall').text();
            }

            if (goUrl === 'insertElm.php') {    /* && submission.theCommand === 'closeOCR'*/
// création de l'OCR ou IACM
                submission.departActuel = '';
                submission.ordre = '';
                submission.possibleNumChildsOCR = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if(submission.neighboursOk && submission.neighboursOk.length > 0){
                    var departs = [],
                        ordres = [],
                        nbreOCRs = [],
                        elmsCall = [];
console.log('test2 neighboursOk');
                    console.log(submission.neighboursOk);
                    submission.neighboursOk.forEach(function (neighbourId) {
                        var dptVoisin = '',
                            typeElm = $('#' + neighbourId).find('+ ul').find('.typeElm').text(),
                            isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                            ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                        if(typeElm === 'elmOCRDepart')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departInstall').text();
                        else if (typeElm === 'elmOCRPoste' || typeElm === 'elmOCRIACM')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text();



                        if (typeElm !== 'elmPoste' && isClose && dptVoisin !== '') {
console.log([ordreVoisin, dptVoisin, neighbourId]);
                            ordres.push(ordreVoisin);
                            departs.push(dptVoisin);
                            nbreOCRs.push(1);
                            elmsCall.push(neighbourId);
                        }
                    });         // déterminer le départ et l'ordre parent à prendre en compte pour l'OCR créé

                    if(departs.length > 0){
                        console.log('test1 et result depart');
                        console.log(departs);
                        var dptParent = delChildInThis(departs, ordres, nbreOCRs, elmsCall);
                        departs = dptParent.departs;
                        ordres = dptParent.ordres;
                        elmsCall = dptParent.elmsCall;

                        console.log(departs);

                        respAdd.push({
                            'dptParent': departs[0],
                            'ordreParent': ordres[0],
                            'voisinsElmId': 'please the new Id',
                            'idOfParent': elmsCall[0]
                        });

                    }               // scinder les départs enfants des départs parents et reduire la grandeur du tableau [departs]
                }


            }   // création de l'OCR ou IACM
            else if (goUrl === 'setElm.php' && (lastTypeElm === 'elmPoste' || lastTypeElm === 'elmOCRDepart' || neighboursMvt.del.length > 0 || neighboursMvt.add.length > 0)) {
// mutation de l'OCR (possible mvt des voisins)


                if (lastTypeElm === 'elmOCRDepart' || departActuel === ''){
                    if(lastTypeElm === 'elmOCRDepart' && lastCommand === 'closeOCR')   destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);
                    submission.ordre = '';
                    submission.departActuel = '';

                    /*  Ré-création de l'OCR  */

                    var departs = [],
                        ordres = [],
                        nbreOCRs = [],
                        elmsCall = [];

                    submission.neighboursOk.forEach(function (neighbourId) {
                        var dptVoisin = '',
                            typeElm = $('#' + neighbourId).find('+ ul').find('.typeElm').text(),
                            isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                            ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                        if(typeElm === 'elmOCRDepart')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departInstall').text();
                        else if (typeElm === 'elmOCRPoste' || typeElm === 'elmOCRIACM')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text();



                        if (typeElm !== 'elmPoste' && isClose && dptVoisin !== '') {

                            ordres.push(ordreVoisin);
                            departs.push(dptVoisin);
                            nbreOCRs.push(1);
                            elmsCall.push(neighbourId);

                        }
                    });         // déterminer le départ et l'ordre parent à prendre en compte pour l'OCR créé

                    if(departs.length > 0){
                        var dptParent = delChildInThis(departs, ordres, nbreOCRs, elmsCall);
                        departs = dptParent.departs;
                        ordres = dptParent.ordres;
                        elmsCall = dptParent.elmsCall;

                        respAdd.push({
                            'dptParent': departs[0],
                            'ordreParent': ordres[0],
                            'voisinsElmId': [submission.targetId],
                            'idOfParent': elmsCall[0]
                        });

                    }               // scinder les départs enfants des départs parents et reduire la grandeur du tableau [departs]


                    //else lastDepartActuel = [];

                }      // utiliser les configurations de l'ancien élement OCRDépart
                else if (lastTypeElm === 'elmPoste' && departActuel !== '') {           // avec submission.theCommand === 'elmOCR'
                    submission.departActuel = '';
                    submission.ordre = '';

                    var papaInfo = theyAreMyFathers(submission.targetId);
                    respAdd.push({
                        'dptParent': papaInfo.depart[0],
                        'ordreParent': papaInfo.ordre[0],
                        'voisinsElmId': [submission.targetId],
                        'idOfParent': papaInfo.targetId[0]
                    });


                    /*(function() {            //ok
                        var getParentOrdre = lastOrdre.slice(0, -2);

                        lastNeighbours.forEach(function (neighbourId) {
                            var isLastDepart = ($('#' + neighbourId).find('+ ul').find('.departActuel').text() === departActuel),
                                isParentOrdre = ($('#' + neighbourId).find('+ ul').find('.ordre').text() === getParentOrdre);

                            if (isLastDepart && isParentOrdre) {

                                submission.departActuel = '';
                                submission.ordre = '';

                                respAdd.push({
                                    'dptParent': departActuel,
                                    'ordreParent': getParentOrdre,
                                    'voisinsElmId': [submission.targetId],
                                    'idOfParent': neighbourId
                                });

                            }
                        });     // déterminer le parent de l'ancien Poste pour construire la configuration du nouveau OCR
                        // les voisins de l'ancienne configuration n'ont pas pu être influencé par un poste donc de même l'OCR créé doit être considéré comme un élement isolé juste
                        // un recepteur (non influencor) envers les voisins de son ancienne configuration !
                    })();           // déduire le depart et le nouvel ordre de l'OCR muté depuis un Poste
                            */

                }    // utiliser les configurations de l'ancien élement Poste
                else if(departActuel !== ''){

                    if (neighboursMvt.del.length > 0){

                        destroyInfluenceEnergyOrdreNeighbours(submission.targetId, neighboursMvt.del);
                        neighboursMvt.del.forEach(function (t) {
                            if(theyAreMyFathers(submission.targetId).targetId.indexOf(t) >= 0){
                                respDel.push({ //idElmWork, connectToDel
                                    'idElmWork': t,
                                    'connectToDel': [submission.targetId]
                                });
                            }
                        });
                    }

                    if (neighboursMvt.add.length > 0){
                        if(submission.theCommand === 'closeOCR'){
                            influenceEnergyOrdreNeighbours(submission.departActuel, submission.ordre, neighboursMvt.add, submission.targetId);
                        }else {

                            neighboursMvt.add.forEach(function (neighbourId) {
                                var typeElm = $('#' + neighbourId).find('+ ul').find('.typeElm').text(),
                                    commandVoisin = $('#' + neighbourId).find('+ ul').find('.theCommand').text(),
                                    dptVoisin = '',
                                    ordreVoisin = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                                if(typeElm === 'elmOCRDepart')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departInstall').text();
                                else if (typeElm === 'elmOCRPoste' || typeElm === 'elmOCRIACM')  dptVoisin = $('#' + neighbourId).find('+ ul').find('.departActuel').text();

                                if(typeElm !== 'elmPoste' && commandVoisin === 'closeOCR' && dptVoisin !== ''){
                                    respAdd.push({
                                        'dptParent': dptVoisin,
                                        'ordreParent': ordreVoisin,
                                        'voisinsElmId': [submission.targetId],
                                        'idOfParent': neighbourId
                                    });
                                }
                            });     //  recherche parmi les élements de la nouvelle configuration,
                            // des voisins prêts à profiter de l'occasion pour influencer l'OCR
                        }
                    }


                }   // mouvements sur les voisins de l'élement, sans départ(ancien départ) un ocr est juste vide mais peuvent être influencé par un nveau élement voisin
                // et ne peut influencer personne et il est inutile qu'il cherche à detruire un enfant car il n'en a pas
            }   // mutation (possible mvt des voisins)
            else if (isCommand && departActuel !== '' && !((lastCommand === 'closeOCR' && submission.theCommand === 'closeOCR') || (lastCommand !== 'closeOCR' && submission.theCommand !== 'closeOCR'))) {
// commande de l'OCR OU IACM
                /*submission.departActuel = departActuel;
                submission.ordre = lastOrdre;*/

                departActuel = departActuel.split(';');
                lastOrdre = lastOrdre.split(';');

                if (submission.theCommand === 'closeOCR'){
                    if(departActuel.length === 1){
                        // suppression parmis les voisins, des élements (parent et frères) à ne pas prendre en compte
                        var voisinsChilds = $('#' + submission.targetId).find('+ ul').find('.neighboursOk').text(),           // String
                            papaElmOrdre = lastOrdre[0].slice(0, -2);


                        if(voisinsChilds !== ''){
                            voisinsChilds = voisinsChilds.split(';');                                       // []

                            var numNoChilds = [];

                            voisinsChilds.forEach(function (voisin) {
                                var voisinDpt = $('#' + voisin).find('+ ul').find('.departActuel').text(),
                                    voisinOrdre1 = $('#' + voisin).find('+ ul').find('.ordre').text(),
                                    voisinOrdre2 = voisinOrdre1.slice(0, -2);


                                if(voisinDpt === departActuel[0] && (voisinOrdre1 === papaElmOrdre || voisinOrdre2 === papaElmOrdre)){                                                       // même départ
                                    numNoChilds.push(voisinsChilds.indexOf(voisin));
                                }
                            });

                            if(numNoChilds.length > 0){
                                numNoChilds.sort(function(a, b){ return b - a });                               // ranger par ordre décroissant avant le processus de suppression
                                numNoChilds.forEach(function (num) {
                                    voisinsChilds.splice(num, 1);
                                });
                            }

                        }else voisinsChilds = [];              // déterminer les voisins (non parent et non frères) à effectivement influencer

                        if(voisinsChilds.length > 0 )   influenceEnergyOrdreNeighbours(departActuel[0], lastOrdre[0], voisinsChilds, submission.targetId);

                    }
                    else if(departActuel.length === 2){
                        console.log('no possible !!');
                        return 'stop';
                    }
                }
                else destroyInfluenceEnergyOrdreNeighbours(submission.targetId, []);
            }   // commande de l'OCR OU IACM

    }


    //console.log(respAdd);
    return [respDel, respAdd];
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

    var localSubmissionInfluenced = [],
        cancelDueToBouclage = false,
        actionToResolveBouclage = {};
                           //par Hypothèse un élément à influencer n'a soit pas de départ (lastDpt = ''), ou il n'a qu'un départ (lastDpt = 'jujiok')

    voisinsElmId.forEach(function (idVoisin) {                                                  // boucle sur chaque élement à influencer
        if(idVoisin !== ''){
                                                                                                 // enregistrement les modifications faites aux élements réseaux
            var elmType = $('#' + idVoisin).find('+ ul').find('.typeElm').text(),                           // type de l'élement influencé
                elmCommand = $('#' + idVoisin).find('+ ul').find('.theCommand').text(),                     // status de l'élement influencé (ouvert : pas de transmission, fermer : tranmettre)
                lastDptActuelText = $('#' + idVoisin).find('+ ul').find('.departActuel').text(),            // départ(s) actuellement présent(s) sur l'OCR à influencer

                lastOrdreText = $('#' + idVoisin).find('+ ul').find('.ordre').text();                       // ordre(s) actuellement présent(s) sur l'OCR à influencer

            console.log('influence de : ' + elmType);

            if(elmType === 'elmOCRDepart')  lastDptActuelText = $('#' + idVoisin).find('+ ul').find('.departInstall').text();


            if(elmType !== 'elmPoste'){                                 // element OCR (ocrPoste, IACM, ocrDépart)


                if(lastDptActuelText === '' && elmType !== 'elmOCRDepart'){

                    console.log('transmission de l\'énergie au voisin');
                    var submissionInfluenced = {
                        'targetId': idVoisin,
                        'departActuel': dptParent,
                        'ordre': ordreParent + '.',
                        'waitingOrdre': true
                    };

                    if(elmCommand === 'closeOCR')  submissionInfluenced.toInfluenced = true;

                    localSubmissionInfluenced.push(submissionInfluenced);


                }       // élement n'ayant aucun départ (actuel)
                else if((lastDptActuelText !== '' || elmType === 'elmOCRDepart') && !(/;/.test(lastDptActuelText))){            // à plus de deux départ, interdiction d'y insérer un autre

                    var commandAssign = elmCommand,
                        idToCommand = idVoisin;

                    if(elmCommand === 'closeOCR'){
                        commandAssign = 'green';


                        if(lastDptActuelText === dptParent && elmType !== 'elmOCRDepart'){
                            idToCommand = idOfParent;
                            console.log('bouclage sur le même départ détecté' + dptParent + ' et réglé au point' + idToCommand);

                            if(!cancelDueToBouclage){
                                cancelDueToBouclage = true;
                                actionToResolveBouclage = {
                                    'theCommand': commandAssign,
                                    'targetId': idToCommand,
                                    'departActuel': lastDptActuelText + ';' + dptParent,
                                    'ordre': lastOrdreText + '.' + numOCRChoix(idVoisin) + ';' + ordreParent
                                };
                            }   //destroyInfluenceEnergyOrdreNeighbours(idToCommand, []);
                        }
                        else{
                            idToCommand = idVoisin;
                            console.log('bouclage des départs ' + lastDptActuelText + ' et ' + dptParent + ' détecté et réglé au point' + idToCommand);
                            destroyInfluenceEnergyOrdreNeighbours(idToCommand, []);
                        }

                    }

                    var submissionInfluenced = {
                        'theCommand': commandAssign,
                        'targetId': idToCommand,
                        'departActuel': lastDptActuelText + ';' + dptParent,
                        'ordre': lastOrdreText + ';' + ordreParent + '.',
                        'waitingOrdre': true
                    };

                    localSubmissionInfluenced.push(submissionInfluenced);

                }       // élement (ocr) ayant déja un départ (actuel ou installé)

            }       // element OCR (ocrPoste, IACM, ocrDépart)
            else {
                if(lastDptActuelText !== dptParent){
                    var submissionInfluenced = {
                        'targetId': idVoisin,
                        'departActuel': dptParent,
                        'ordre': ordreParent + '.' + 'P'
                    };

                    localSubmissionInfluenced.push(submissionInfluenced);

                }

            }       // element poste à influencer

       }                    // l'élement doit être non-vide

    });                     // boucle sur chaque élement à influencer, determination de l'action futur à mener

    if(!cancelDueToBouclage && localSubmissionInfluenced.length > 0){

        var toInfluenced = [];

        localSubmissionInfluenced.forEach(function (submissionVerified) {
            if(submissionVerified.waitingOrdre){
                delete  submissionVerified.waitingOrdre;
                submissionVerified.ordre = submissionVerified.ordre + numOCRChoix(idOfParent);

                if(submissionVerified.toInfluenced){
                    delete submissionVerified.toInfluenced;
                    toInfluenced.push(submissionVerified);
                }
            }

            setElmAfterCalcul(submissionVerified);
        });

        // il est idéal d'avoir traité tous les elments enfants d'un parent avant d'aller influencer ses petit fils car ces derniers peuvent de manière erroné,
// influencer leurs ainés car ces derniers n'ayant pas encore été traité par la boucle.

        if(toInfluenced.length > 0){
            toInfluenced.forEach(function (data) {
                var voisinsChilds = $('#' + data.targetId).find('+ ul').find('.neighboursOk').text();           // String


                if(voisinsChilds !== ''){
                    voisinsChilds = voisinsChilds.split(';');                                       // []

                    var numNoChilds = [];
                    numNoChilds.push(voisinsChilds.indexOf(idOfParent));

                    voisinsChilds.forEach(function (voisin) {
                         /*var voisinDpt = '',
                            isElmDepart = ($('#' + voisin).find('+ ul').find('.typeElm').text() === 'elmOCRDepart'),
                            voisinOrdre1 = $('#' + voisin).find('+ ul').find('.ordre').text(),
                            voisinOrdre2 = voisinOrdre1;

                        if(isElmDepart)   voisinDpt = $('#' + voisin).find('+ ul').find('.departInstall').text();
                        else  voisinDpt = $('#' + voisin).find('+ ul').find('.departActuel').text();

                        voisinOrdre2 = voisinOrdre2.slice(0, -2);

                        console.log([voisinOrdre1, voisinOrdre2]);

                        //console.log("l'ordre papa ou frère : " + voisinOrdre1 + " ou " + voisinOrdre2 + "\n et le papa est " + dptParent);

                        if(voisinDpt === dptParent && (voisinOrdre1 === ordreParent || voisinOrdre2 === ordreParent)){                                                       // même départ

                            numNoChilds.push(voisinsChilds.indexOf(voisin));
                        }*/

                         /*who is my papa ? : is idOfParent*/                                       // already push
                         /*who are my brothers ? : is voisin who have papa who is idOfParent*/

                         var papasVoisin = theyAreMyFathers(voisin);

                         if(papasVoisin.targetId.indexOf(idOfParent) >= 0){
                             numNoChilds.push(voisinsChilds.indexOf(voisin));
                         }          // he is my brother


                    });



                    if(numNoChilds.length > 0){
                        numNoChilds.sort(function(a, b){ return b - a });                               // ranger par ordre décroissant avant le processus de suppression
                        //console.log(numNoChilds);
                        numNoChilds.forEach(function (num) {
                            voisinsChilds.splice(num, 1);
                        });
                    }

                }else voisinsChilds = [];


                if(voisinsChilds.length > 0 ){
                    influenceEnergyOrdreNeighbours(data.departActuel, data.ordre, voisinsChilds, data.targetId);
                    console.log('influence à nouveau');
                }
            });                         // boucle sur les actions futurs et fixation des voisins à effectivement influencer
        }       // règle1: un voisin est effectivement à influencer s'il n'est ni le père, ni un frère du donneur d'ordre
    }
    else if(cancelDueToBouclage) {
        setElmAfterCalcul(actionToResolveBouclage);
    }



}



function destroyInfluenceEnergyOrdreNeighbours(idElmWork, connectToDel){


    var typeElmWork = $('#' + idElmWork).find('+ ul').find('.typeElm').text(),                               // type d'élement voulant détruire le lien avec ses enfants (donneur d'ordre)
        dpt = $('#' + idElmWork).find('+ ul').find('.departActuel').text(),                                  // départ conccerné (du donneur d'ordre)
        ordreDpt = $('#' + idElmWork).find('+ ul').find('.ordre').text(),                                    // Ordre parent du donneur d'ordre
        neighboursWork = $('#' + idElmWork).find('+ ul').find('.neighboursOk').text();           // String   // les voisins strucuturels du donneur d'ordre


    if(neighboursWork !== '')  neighboursWork = neighboursWork.split(';');                                                              // []
    else neighboursWork = [];

    if(typeElmWork === 'elmOCRDepart'){
        dpt = $('#' + idElmWork).find('+ ul').find('.departInstall').text();                                 // cas de départ installé
        ordreDpt = 'dpt';                                                                                    // ordre universel d'un départ
    }

    console.log('hello to destroy, destroy this :');
    console.log([dpt, ordreDpt]);

    if(connectToDel.length > 0) neighboursWork = connectToDel;

    if(neighboursWork.length > 0 && dpt !== ''){
        //console.log('voisins Mtn: ' + neighboursWork);
        neighboursWork.forEach(function (t) {
// recherche sur les voisins structurel des élements enfants du donneur d'ordre

            //var submissionDestroyed = {},                                                                         // submission des destructions
            var typeElmDestroy = $('#' + t).find('+ ul').find('.typeElm').text(),                                 // type de l'élement à analyser (pour destruction)
                commandElmDestroy = $('#' + t).find('+ ul').find('.theCommand').text(),                           // commande(OCR) de l'élement à analyser (pour destruction)
                dptElmDestroy = '',                                                                               //String      // départ de l'élement à analyser (pour destruction)
                ordreElmDestroy = $('#' + t).find('+ ul').find('.ordre').text();                                  // ordre de l'élement à analyser (pour destruction)

            if(typeElmDestroy === 'elmOCRDepart')   dptElmDestroy = $('#' + t).find('+ ul').find('.departInstall').text();
            else    dptElmDestroy = $('#' + t).find('+ ul').find('.departActuel').text();


            if (dptElmDestroy !== '' && typeElmDestroy !== 'elmOCRDepart') {         // String to []

                dptElmDestroy = dptElmDestroy.split(';');
                ordreElmDestroy = ordreElmDestroy.split(';');
                // String to []


                var num = dptElmDestroy.indexOf(dpt),                                   // vérification du statut départ concerné de l'élement analysé
                    numOrdre = 96;                                                      // valeur erreur (en cas d'erreur de vérification)


                if (ordreElmDestroy[0].slice(0, -2) === ordreDpt) {
                    numOrdre = 0;
                }
                else if (dptElmDestroy.lenght === 2 && ordreElmDestroy[1].slice(0, -2) === ordreDpt) {
                    numOrdre = 1;
                }                   // vérification du statut enfant de l'élement analysé

                console.log([num, numOrdre]);
                console.log(dptElmDestroy);
                console.log(ordreElmDestroy);

                if (dptElmDestroy.length === 1 && num >= 0 && numOrdre === 0) {            // un seul départ présent sur l'élement analysé

                    var submissionDestroyed = {
                        'targetId': t,
                        'departActuel': '',
                        'ordre': ''
                    };

                    if(typeElmDestroy !== 'elmPoste')  refreshNumOCR(idElmWork,ordreElmDestroy[numOrdre]);

                    if (typeElmDestroy !== 'elmPoste' && commandElmDestroy === 'closeOCR') destroyInfluenceEnergyOrdreNeighbours(t, []);       // nouveau donneur d'ordre (ordre de destruction des petits enfants)

                    // il est important de donner d'abord l'ordre avant d'exécuter la destruction car cette derniere se reférera à des infos (départ, ordreDépart) du donneur d'ordre

                    setElmAfterCalcul(submissionDestroyed);

                }       // un seul départ présent sur l'élement analysé
                else if (dptElmDestroy.length === 2 && num >= 0) {                                               //petite garantie, pas de poste avec deux départs

                    refreshNumOCR(idElmWork, ordreElmDestroy[numOrdre]);

                    console.log('boucle attendu');

                    dptElmDestroy.splice(num, 1);
                    ordreElmDestroy.splice(numOrdre, 1);

                    var submissionDestroyed = {
                        'targetId': t,
                        'departActuel': dptElmDestroy[0],
                        'ordre': ordreElmDestroy[0]
                    };


                    setElmAfterCalcul(submissionDestroyed);

                }   // deux départs présents sur l'élement analysé
            }
            else if(typeElmDestroy === 'elmOCRDepart'){

                var submissionDestroyed = {
                    'targetId': t,
                    'departActuel': dptElmDestroy,
                    'ordre': 'dpt'
                };

                ordreElmDestroy = ordreElmDestroy.split(';');
                if(ordreElmDestroy.length === 2){

                    var num = ordreElmDestroy.indexOf('dpt');
                    ordreElmDestroy.splice(num, 1);
                    refreshNumOCR(idElmWork,ordreElmDestroy[0]);
                }

                setElmAfterCalcul(submissionDestroyed);
            }

        });                   // recherche sur les voisins structurel du donneur d'ordre, des élements enfants
    }         // règle2: la destruction s'effectue uniquement sur les enfants du donneur d'ordre

}

function isMyFather(idFils) {

    var getParentOrdre = $('#' + idFils).find('+ ul').find('.ordre').text(),
        departActuel = $('#' + idFils).find('+ ul').find('.departActuel').text(),
        neighboursLocal = $('#' + idFils).find('+ ul').find('.neighboursOk').text(),     // String
        response = false;

    getParentOrdre = getParentOrdre.slice(0, -2);


    if(neighboursLocal !== ''){
        neighboursLocal = neighboursLocal.split(';');

        neighboursLocal.forEach(function (neighbourId) {
            var isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                isLastDepart = ($('#' + neighbourId).find('+ ul').find('.departActuel').text() === departActuel),
                isParentOrdre = ($('#' + neighbourId).find('+ ul').find('.ordre').text() === getParentOrdre);

            if(isLastDepart && isParentOrdre && isClose){
                response = {
                    'targetId': neighbourId,
                    'depart': departActuel,
                    'ordre': getParentOrdre
                };
            }
        });
    }                      // []
    //else    neighboursLocal = [];


    return response;
}

function theyAreMyFathers(idFilsOpen) {
    var getParentOrdre = $('#' + idFilsOpen).find('+ ul').find('.ordre').text(),
        departActuel = $('#' + idFilsOpen).find('+ ul').find('.departActuel').text(),
        neighboursLocal = $('#' + idFilsOpen).find('+ ul').find('.neighboursOk').text(),     // String
        response = {
            'targetId': [],
            'depart': [],
            'ordre': []
        };

    if(getParentOrdre !== ''){
        getParentOrdre = getParentOrdre.split(';');
        departActuel = departActuel.split(';');

        getParentOrdre[0] = getParentOrdre[0].slice(0, -2);
        if(getParentOrdre[1])  getParentOrdre[1] = getParentOrdre[1].slice(0, -2);


        if(neighboursLocal !== ''){
            neighboursLocal = neighboursLocal.split(';');

            neighboursLocal.forEach(function (neighbourId) {
                var isClose = ($('#' + neighbourId).find('+ ul').find('.theCommand').text() === 'closeOCR'),
                    departNei = $('#' + neighbourId).find('+ ul').find('.departActuel').text(),
                    ordreNei = $('#' + neighbourId).find('+ ul').find('.ordre').text();

                var numDpt = departActuel.indexOf(departNei),
                    numOrdre = getParentOrdre.indexOf(ordreNei);

                if(numDpt >= 0 && numOrdre === numDpt && isClose){          // && numOrdre >= 0

                    response.targetId.push(neighbourId);
                    response.depart.push(departNei);
                    response.ordre.push(ordreNei);

                }
            });
        }                      // []
        //else    neighboursLocal = [];
    }
    //else // he have no fathers


    return response;
}

function delChildInThis(departs, ordres, nbreOCRs, elmsCall) {
    var num = [];
    for(var i = 0, N = departs.length; i < N; i++){

        for(var j = i + 1; j < N; j++){
            if(i === j || departs[i] !== departs[j]) continue;


            if(ordres[i].slice(0, -2) === ordres[j]){
                num.push(i);
            }
            else if(ordres[j].slice(0, -2) === ordres[i]){
                num.push(j);
            }

        }
    }
    if(num.length > 0){
        num.sort(function(a, b){ return b - a });
        num.forEach(function (t) {
            departs.splice(t, 1);
            ordres.splice(t, 1);
            nbreOCRs.splice(t,1);
            elmsCall.splice(t,1);
        })
    }


    return { 'departs':departs, 'ordres':ordres, 'nbreOCRs': nbreOCRs, 'elmsCall': elmsCall };
}


function numOCRChoix(neighbourId) {

    var numPossibleActuel = $('#' + neighbourId).find('+ ul').find('.possibleNumChildsOCR').text();

    if(numPossibleActuel !== ''){

        numPossibleActuel = numPossibleActuel.split(';');

        var result = numPossibleActuel.shift(),
            submissionChoixNum = {
                'targetId': neighbourId,
                'possibleNumChildsOCR': numPossibleActuel
            };

        setElmAfterCalcul(submissionChoixNum);

        return result;
    }
    else{

        var nomNeighbour = $('#' + neighbourId).find('+ ul').find('.nom').text();
        console.log('Nombre de voisins OCR disponibles pour ' + nomNeighbour + ' > 10 !');
        return 'A';
    }

}

function refreshNumOCR(idElmWork, ordreToRefresh) {

    var numPossibleActuel = $('#' + idElmWork).find('+ ul').find('.possibleNumChildsOCR').text();

    if(numPossibleActuel === '')    numPossibleActuel = [];
    else numPossibleActuel = numPossibleActuel.split(';');

    numPossibleActuel.unshift(ordreToRefresh.slice(-1));

    var submissionChoixNum = {
        'targetId': idElmWork,
        'possibleNumChildsOCR': numPossibleActuel
    };

    setElmAfterCalcul(submissionChoixNum);

}

function refreshNumOCRSpecialDel(idElmDel) {
    var ordre = $('#' + idElmDel).find('+ ul').find('.ordre').text();

    if(ordre === '') return true;

    ordre = ordre.split(';');

    if(ordre.length === 1){
        var papaId = isMyFather(idElmDel).targetId;
        refreshNumOCR(papaId, ordre[0]);
    }
    else if(ordre.length === 2){

        var papas = theyAreMyFathers(idElmDel);

        refreshNumOCR(papas.targetId[0], ordre[0]);
        refreshNumOCR(papas.targetId[1], ordre[1]);
    }
}



function initDptOdrPossVoisin () {
    var submissionInitPoste = {
            'departActuel': '',
            'ordre': ''
        },
        submissionInitOCR = {
            'departActuel': '',
            'ordre': '',
            'possibleNumChildsOCR': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        },
        submissionInitDepart = {
            'possibleNumChildsOCR': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        };

    $('.OCR, .poste').each(function () {
        var typeElm = $(this).find('+ ul').find('.typeElm').text(),
            submissionInit = {};


        //console.log(submissionInit);

        if(typeElm === 'elmOCRDepart')  submissionInit = submissionInitDepart;
        else if(typeElm === 'elmPoste') submissionInit = submissionInitPoste;
        else submissionInit = submissionInitOCR;

        submissionInit.targetId = $(this).attr('id');

        $.ajax({
            type:'POST',
            url: 'setElm.php',
            async: false,
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            data: JSON.stringify(submissionInit),
            success: function(data){
                console.log('ok');
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

    });

}             // en cours de création !!!, doit prendre en compte l'attribution de num aux enfants d'un élement