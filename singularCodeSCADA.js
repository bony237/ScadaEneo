/*
*    L'API "PDF JS" permet la lecture d'un PDF. Notre solution vise l'intersection avec le contrôle sur le document de l'API et
*    l'existance d'un calque interactif dans le but de créer le dynamisme requis pour l'implémentation d'une application web.
 */

var page1 = null,
    calque = document.createElement('div'),                          // création du calque
    elmToTrack = document.getElementById('viewer'),                  // section PDF à traquer pour le contrôle de l'API PDF
    elmToShut = document.getElementById('sidebarToggle'),
    widthCalque = 0,
    heightCalque = 0;

const pctWidthElmPoste = (70/15748)*100,                            // cte du rapport voulue entre "width" element par rapport au calque
    pctHeightElmPoste = (70/7875)*100,                           // cte du rapport voulue entre "height" element par rapport au calque
    pctWidthElmOCR = (40/15748)*100,
    pctHeightElmOCR = (40/15748)*100;


calque.id = 'calque';
calque.style.all = 'inherit';                             // obtenir l'ensemble des propriétés  génerales de .canvasWrapper | suffisant pour assurer l'option recheche du pdf viewer
calque.style.position = "absolute";                       // s'assurer du positionnement absolu du calque
calque.style.top = "0px";                                 // observation : sans ce positionnement à 0, le calque se met en dessous du 1st elm (#page1) de .canvasWrapper
calque.style.left = "0px";
calque.style.zIndex = "3";                                // s'assurer du positionnement du calque au dessus de tout


/*calque.style.width = page1.style.width;                 // conflit empêchant le fonctionnement de l'option recherche du pdf viewer
calque.style.height = page1.style.height;*/

//alert('junior');

var observerPdf = new MutationObserver(function (mutationList) {       // tracker les mutations DOM de l'élement #viewer

    try{
        mutationList.forEach(function(mutation){

            if(mutation.target.className === 'textLayer'){          // cette mutation signalée, on en déduit que la mutation précédente (#page1) s'est effectuée avec succès

                page1 = document.getElementById('page1');           // recupération de l'élement #page1

                page1.parentNode.appendChild(calque);               // ajout du calque dans le DOM

                widthCalque = parseInt(page1.style.width);
                heightCalque = parseInt(page1.style.height);

                calque.style.fontSize = ((pctWidthElmPoste*parseInt(page1.style.width))/40) + '%';     //calcul et fixation dans css d'une variable servant au font size

                if(elmToShut.classList.contains('toggled')){
                    var event = new MouseEvent('click', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });

                    elmToShut.dispatchEvent(event);           // simuler un click pour enlever l'apparition génante d'un élement (apparition ordonnée par un fichier JS difficile d'accès)
                }

                throw BreakException;
            }
        });
    } catch (e){
        if(e !== BreakException)  throw e;

    }

});

observerPdf.observe(elmToTrack, {
    childList: true,
    subtree: true
});
/* fin du tracking*/

/*
*   Dynamisme de l'application web
*
* */
var isEdit = false,                                                     // état du mode edit
    isCommand = true,                                                   // état du mode command
    isDia = false,                                                      // état du bloc de dialogue (command ou edit)
    trace = null,                                                       // sctokage de l'élement en cours d'utilisation dans la boîte de dialogueue
    neighbours = [],
    viewer = document.getElementById('viewerContainer'),                 // bloc pdf à dépacer
    saveClassAddElm = {},
    eCreer = null,
    formEdit= document.querySelector('#editDialog form'),                 // formulaire EDITION
    formCommand  = document.querySelector('#commandDialog form'),         // formulaire COMMANDE
    commandFormHasChange = false,
    editFormHasChange = false,
    submission = {
        'type': '',
        'percXY': [],
        'target': '',
        'neighboursOk': [],
        'typeElm': '',
        'depart': '',
        'formPoste': '',
        'nom': '',
        'code': '',
        'nomAgence': '',
        'nomDex': '',
        'location': '',
        'theCommand': '',
        'commentaireCommand': ''
    };

//alert('jesus');
/*Configurations initiales*/
(function () {
    $('#parentDialogue').show();                                             // cacher la section dialogue au debut de fonctionnement de l'app
    //$('#editDialog').hide();
    viewer.className = 'move';
    /*$('#commandDialog').hide();
    $('#editDialog').show();
    $('#depart').parent().hide();
    $('#powFormPoste').hide();

    formCommand.reset();                                                    // réinitialiser les deux formulaires
    formEdit.reset();

    viewer.className = 'move';*/
    //viewer.classList.replace('supprMove','move');
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
            if(commandFormHasChange)    beforeWhatToDo('permissionMode');             // and decide what to do
            else thingsToDo['changeMode']();
        } else if (isEdit) {
            if(editFormHasChange)   beforeWhatToDo('alert');                          // and decide what to do
            else  thingsToDo['changeMode']();
        }
    } else {
        thingsToDo['changeMode']();
    }
});                //  changement du mode à travers la barre de navigation


$('#normalCloseDia').click(function () {
    if(editFormHasChange || commandFormHasChange)   beforeWhatToDo('permissionClose');
    else   thingsToDo['close']();
});                            //   bouton fermer (avec vérification de changement)


$('#supprModifDiaEdit').find('.modifyElm').click(function () {
    $('#editDialog form').show(700);
    $('#supprModifDiaEdit').hide();

});      // avant garde de la suppression ou de la modification d'un élement


$('[name = "typeElm"]').click(function () {

    //submission.percXY = [(eCreer.offsetX*100/widthCalque - pctWidthElmOCR/2) + '%', (eCreer.offsetY*100/heightCalque - pctHeightElmOCR/2) + '%'];

    if( $('#elmOCRDepart').is(':checked')){

        $('#powFormPoste').hide();
        $('#depart').parent().show();
        //submission.typeElm = $('#elmOCRDepart').val();
    }
    else if($('#elmPosteChoix').is(':checked')){

        $('#depart').parent().hide();
        $('#powFormPoste').show();
        //submission.percXY = [(eCreer.offsetX*100/widthCalque - pctWidthElmPoste/2) + '%', (eCreer.offsetY*100/heightCalque - pctHeightElmPoste/2) + '%'];
        //submission.typeElm = $('#elmPosteChoix').val();
    }
    else{
        $('#depart').parent().hide();
        $('#powFormPoste').hide();

        //if($('#elmOCRChoix').is(':checked'))  submission.typeElm = $('#elmOCRChoix').val();
        //else    submission.typeElm = $('#elmIACMChoix').val();
    }
});                         // faire apparaitre le champ pour le nom du départ en cas de click sur OCR de départ


$('#editDialog').find('input').change(function () {
    editFormHasChange = true;
});


$('#commandDialog').find('input').change(function () {
    commandFormHasChange = true;
});

$('#commandDialog').find('textarea').change(function () {
    commandFormHasChange = true;
});


var thingsToDo;
thingsToDo = {

    'commandElmOCR': function (e) {
        // commande d'un OCR
        supprClassAddedElm(saveClassAddElm);    //  fonction de l'effet visuel appliqué aux précedents element à travers css via les noms de classe
        restituteInfosOCR(e, 'command');        // fonction qui restitue les infos de l'élement (aval-traitement recursif, etat pin, infos, def neighbours)
        e.target.classList.add('evidenceParent');
        saveClassAddElm['evidenceParent'].push(e.target);
        trace = e.target;

        formCommand.reset();
        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        submission.type = 'command';
        submission.target = e.target;
    },

    'selectORunselectNeighbour': function (e) {
        // selection ou déselection d'un voisin
        alert('select or deselect');
        neighbours.forEach(function (voisin) {
            voisin.classList.add('neighbour');
            saveClassAddElm['neighbour'].push(e.target);                                          // sauvegarder le changement pour l'annuler après
        });
        editFormHasChange = true;
        var num = neighbours.indexOf(e.target);
        if(num < 0){
            // selected
            neighbours.push(e.target);      // add to table neighbours
            e.target.classList.add('neighbour');
        }else{
            // deselected
            neighbours.splice(num,1);       // delete from table neighbours
            e.target.classList.remove('neighbour');
        }


        submission.neighboursOk = neighbours;

    },

    'modifyElm': function (e) {
        // modification d'un élement
        supprClassAddedElm(saveClassAddElm);
        restituteInfos(e, 'edit');                                  // fonction qui restitue les infos de création de l'élement
        e.target.classList.add('elmUpdate');
        saveClassAddElm['elmUpdate'].push(e.target);
        trace = e.target;

        $('#depart').parent().hide();
        $('#powFormPoste').hide();

        $('#optionEditTitle').text('Modification');
        $('#optionEditSubmit').val('Modifier');
        $('#supprModifDiaEdit').show().find('+ form').hide();       //show supprim possibility
        formEdit.reset();
        $('#record').show();

        viewer.className = 'move';                                  // ne pas enregistrer ce changement de classe car trop standart
        $('#parentDialogue').show(500);
        isDia = true;

        submission.type = 'modify';
        submission.target = e.target;
    },

    'createElm': function (e) {
        // création d'un élement
        supprClassAddedElm(saveClassAddElm);
        $('#depart').parent().hide();
        $('#powFormPoste').hide();

        $('#optionEditTitle').text('Création');
        $('#optionEditSubmit').val('Créer');
        $('#supprModifDiaEdit').hide().find('+ form').show();       //hide supprim possibility
        formEdit.reset();
        $('#record').hide();                                        // hide the section save data

        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        submission.type = 'create';
        eCreer = e;
    },

    'changeMode': function () {
        //changer de mode
        supprClassAddedElm(saveClassAddElm);
        isDia = false;
        $('#parentDialogue').hide(500);
        viewer.className = 'supprMove';

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
    },

    'close': function () {

        supprClassAddedElm(saveClassAddElm);
        isDia = false;
        editFormHasChange = false;
        commandFormHasChange = false;
        $('#parentDialogue').hide(500);
        viewer.className = 'supprMove';
    }/*,

    'appearLess': function (e) {
        alert('survol Less infos');
    },

    'nothing': function () {
        alert('rien à faire');
    }*/
};

function whatToDo(e, code){
    var elmOCR = e.target.classList.contains('OCR'),            //elmPoste = e.target.classList.contains('Poste'),
        calque = (e.target.id === 'calque');


    switch (code){
        case 'C' :
            if(!isDia && isCommand && elmOCR)   return 'commandElmOCR';
            if(isDia && !calque && e.target !== trace && isCommand && elmOCR){
                if(commandFormHasChange)    beforeWhatToDo('permissionOCR');
                else return 'commandElmOCR';
            }
            if(isDia && !calque && e.target !== trace && isEdit) return 'selectORunselectNeighbour';
            break;
        case 'Db':
            if(isEdit){
                if(editFormHasChange)   beforeWhatToDo('alert');
                else{
                    if(calque)  return 'createElm';
                    else    return 'modifyElm'
                }
            }
            /*if(isEdit && isDia){
                if(editFormHasChange)    beforeWhatToDo('alert');
                else return 'modifyElm';
            }
            if(isEdit && !isDia && calque)  return 'createElm';
            if(isEdit && !isDia && !calque)  return 'modifyElm';*/
            break;
        /*case 'Ho':
            if(!calque){
                if(isEdit)  return 'appearLess';
                if(isCommand)  return 'appearAll';
            }
            break;*/

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
    //alert('rien');

    verify();

    submission.nom = $('#nom').val();
    submission.code = $('#code').val();
    submission.nomAgence = $('#nomAgence').val();
    submission.nomDex = $('#nomDex').val();
    submission.location = $('#location').val();

    $('[name="formPoste"]').each(function () {

        if($(this).is(':checked'))  submission.formPoste = $(this).val();

    });


    $('[name="theCommand"]').each(function () {

        if($(this).is(':checked'))  submission.theCommand = $(this).val();

    });



    submission.commentaireCommand = $('#commentaireCommand').val();

//    console.log(submission);

    /*$.ajax({
        type:'POST',
        url:'request.php',
        success:function(data){console.log(data)},
        error:function(){console.log("la rêquete n\'a pas aboutit")}
    });*/


    event.preventDefault();

});

/*calque.addEventListener('mouseover', function (e) {
    //alert('hello');
    var doThis = whatToDo(e, 'Ho');
    thingsToDo[doThis](e);
}, false);*/



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
            else thingsToDo['close']();
        });
    }

}

function supprClassAddedElm(saveClassAddElm) {

    for (var classAdded in saveClassAddElm){
        saveClassAddElm[classAdded].forEach(function (targetElm) {
            targetElm.classList.remove(classAdded);
        });
    }

}



/*calque.addEventListener('click', function (e) {                       // test de création d'élement à un endroit pécis prenant en compte la position
    // du curseur comme étant les coordonnées du centre de l'élement à créer
    var elm = document.createElement('button'),
        widthCalque = parseInt(page1.style.width),
        heightCalque = parseInt(page1.style.height);

    elm.innerHTML = '1 2';

    elm.style.position = 'absolute';
    elm.style.fontSize = 'inherit';

    elm.style.height = pctHeightElmPoste + '%';
    elm.style.width = pctWidthElmPoste + '%';
    elm.style.left = (e.offsetX*100/widthCalque - pctWidthElmPoste/2) + '%';
    elm.style.top = (e.offsetY*100/heightCalque - pctHeightElmPoste/2) + '%';

    console.log(elm.style.left);
    calque.appendChild(elm);

}, false);*/


/*function envoyer() {

}*/
