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
    pctHeightElmOCR = (40/7875)*100;


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

                // fonction appel de la BD si elle existe !! et prendre les paramètres pct pour la création des élements sur le calque !!
                // création de p(span)

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
    saveClassAddToElm = {
        'evidenceParent':[],
        'evidenceChild':[],
        'elmToUpdate':[],
        'neighbour':[]
    },
    eCreer = {},
    formEdit= document.querySelector('#editDialog form'),                 // formulaire EDITION
    formCommand  = document.querySelector('#commandDialog form'),         // formulaire COMMANDE
    commandFormHasChange = false,
    editFormHasChange = false,
    goUrl = '',
    submission = {
        /*'type': '',
        'percXY': [],
        'targetId': '',
        'neighboursOk': [],
        'typeElm': '',
        'departInstall': '',
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

//alert('jesus');
/*Configurations initiales*/
(function () {
    $('#parentDialogue').show();                                             // cacher la section dialogue au debut de fonctionnement de l'app
    //$('#editDialog').hide();
    viewer.className = 'move';
    /*$('#commandDialog').hide();
    $('#editDialog').show();
    $('#departInstall').parent().hide();
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

$('#supprModifDiaEdit').find('.deleteElm').click(function () {
    deleteElmProccess(trace);

});      // suppression élement du réseau


$('[name = "typeElm"]').click(function () {

    submission.percXY = [(eCreer.X*100/widthCalque - pctWidthElmOCR/2) + '%', (eCreer.Y*100/heightCalque - pctHeightElmOCR/2) + '%'];

    submission.theCommand = 'close';

    if( $('#elmOCRDepart').is(':checked')){

        $('#departInstall').prop('required',true).parent().show();

        $('#powFormPoste').hide().find('input').prop('required',false);
        $('#powFormPoste').find(':radio').prop('checked',false);
        $('#powerPoste').val('');

        submission.typeElm = $('#elmOCRDepart').val();
        delete submission.powerPoste;
        delete submission.formPoste;
    }
    else if($('#elmPosteChoix').is(':checked')){

        $('#departInstall').prop('required',false).parent().hide();
        $('#departInstall').val('');

        $('#powFormPoste').show().find('input').prop('required',true);
        submission.percXY = [(eCreer.X*100/widthCalque - pctWidthElmPoste/2) + '%', (eCreer.Y*100/heightCalque - pctHeightElmPoste/2) + '%'];
        submission.typeElm = $('#elmPosteChoix').val();
        delete submission.departInstall;
        delete submission.theCommand;
    }
    else {
        $('#departInstall').prop('required',false).parent().hide();
        $('#departInstall').val('');

        $('#powFormPoste').hide().find('input').prop('required',false);
        $('#powFormPoste').find(':radio').prop('checked',false);
        $('#powerPoste').val('');

        if($('#elmOCRChoix').is(':checked'))  submission.typeElm = $('#elmOCRChoix').val();
        else    submission.typeElm = $('#elmIACMChoix').val();

        delete submission.powerPoste;
        delete submission.formPoste;
        delete submission.departInstall;
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
        supprClassAddedElm();    //  fonction de l'effet visuel appliqué aux précedents element à travers css via les noms de classe
        //restituteInfosOCR(e, 'command');        // fonction qui restitue les infos de l'élement (aval-traitement recursif, etat pin, infos, def neighbours)
        e.target.classList.add('evidenceParent');
        saveClassAddToElm['evidenceParent'].push(e.target.id);
        trace = e.target;

        if(isDia)   $('#parentDialogue').fadeOut('fast');
        formCommand.reset();
        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        submission.targetId = e.target.id;

        goUrl = 'setElm.php';
    },

    'selectORunselectNeighbour': function (e) {
        // selection ou déselection d'un voisin
        //alert('select or deselect');

        $('#editDialog form').show(700);
        $('#supprModifDiaEdit').hide();

        editFormHasChange = true;
        var num = neighbours.indexOf(e.target.id);
        if(num < 0){
            // selected
            neighbours.push(e.target.id);      // add to table neighbours
            e.target.classList.add('neighbour');
        }else{
            // deselected
            neighbours.splice(num,1);       // delete from table neighbours
            e.target.classList.remove('neighbour');
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

    },

    'modifyElm': function (e) {
        // modification d'un élement
        formEdit.reset();
        supprClassAddedElm();
        restituteInfosEdit(e.target);                                  // fonction qui restitue les infos de création de l'élement (restituer les voisins entant que tableau et les y attribuer la classe neighbour)
        e.target.classList.add('elmToUpdate');
        saveClassAddToElm['elmToUpdate'].push(e.target.id);
        trace = e.target;

        $('#departInstall').parent().hide();
        $('#powFormPoste').hide();

        $('#optionEditTitle').text('Modification');
        $('#optionEditSubmit').val('Modifier');
        $('#supprModifDiaEdit').show().find('+ form').hide();       //show supprim possibility

        $('#record').show();

        if(isDia)   $('#parentDialogue').fadeOut('fast');
        viewer.className = 'move';                                  // ne pas enregistrer ce changement de classe car trop standart
        $('#parentDialogue').show(500);
        isDia = true;

        submission.targetId = e.target.id;

        //eCreer.X = e.offsetX;                                recalcul de eCreer de départ
        //eCreer.Y = e.offsetY;

        goUrl = 'setElm.php';
    },

    'createElm': function (e) {
        // création d'un élement
        supprClassAddedElm();
        $('#departInstall').parent().hide();
        $('#powFormPoste').hide();

        $('#optionEditTitle').text('Création');
        $('#optionEditSubmit').val('Créer');
        $('#supprModifDiaEdit').hide().find('+ form').show();       //hide supprim possibility
        formEdit.reset();
        $('#record').hide();                                        // hide the section save data

        if(isDia)   $('#parentDialogue').fadeOut('fast');
        viewer.className = 'move';
        $('#parentDialogue').show(500);
        isDia = true;

        //submission.type = 'create';
        eCreer.X = e.offsetX;
        eCreer.Y = e.offsetY;

        goUrl = 'insertElm.php';
    },

    'changeMode': function () {
        //changer de mode

        thingsToDo['close']();

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

        trace = null;
        supprClassAddedElm();
        submission = {};
        neighbours = [];
        eCreer = {};
        goUrl = '';
        isDia = false;
        editFormHasChange = false;
        commandFormHasChange = false;
        $('#parentDialogue').hide(500);
        viewer.className = 'supprMove';
    }

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

    if($('#departInstall').val() !== '')    submission.departInstall = $('#departInstall').val();

    if($('#nomAgence').val() !== '')  submission.nomAgence = $('#nomAgence').val();
    if($('#nomDex').val() !== '')    submission.nomDex = $('#nomDex').val();
    if($('#location').val() !== '')    submission.location = $('#location').val();

    $('[name="formPoste"]').each(function () {

        if($(this).is(':checked'))  submission.formPoste = $(this).val();

    });


    $('[name="theCommand"]').each(function () {

        if($(this).is(':checked'))  submission.theCommand = $(this).val();

    });


    if($('#powerPoste').val() !== '')    submission.powerPoste = $('#powerPoste').val();

    if($('#commentaireCommand').val() !== '')    submission.commentaireCommand = $('#commentaireCommand').val();

    if(neighbours.length > 0)   submission.neighboursOk = neighbours;


    console.log(submission);
    //alert(submission.typeElm);


    $.ajax({
            type:'POST',
            url: goUrl,
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            data: JSON.stringify(submission),
            success: function(newId){

                createElmProcess(newId, submission);
                //updateElmProcess(trace.id, submission);

                thingsToDo['close']();
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
            else thingsToDo['close']();
        });
    }

}

function supprClassAddedElm() {

    $.each( saveClassAddToElm, function (theClass, theIds) {
        theIds.forEach(function (t) {
            if(t !== '')    $('#' + t).removeClass(theClass);
        });
    });

    saveClassAddToElm = {
        'evidenceParent':[],
        'evidenceChild':[],
        'elmToUpdate':[],
        'neighbour':[]
    }

}

function restituteInfosEdit(targetElmToEdit) {

    //recalculer les vrais offsetX et offsetY de l'élement

    if($('#' + targetElmToEdit.id).find('+ ul').find('.typeElm').text() === 'poste'){
        eCreer.X = (parseInt(targetElmToEdit.style.left) + pctWidthElmPoste/2)*widthCalque/100;
        eCreer.Y = (parseInt(targetElmToEdit.style.top) + pctHeightElmPoste/2)*heightCalque/100;
    }else {
        eCreer.X = (parseInt(targetElmToEdit.style.left) + pctWidthElmOCR/2)*widthCalque/100;
        eCreer.Y = (parseInt(targetElmToEdit.style.top) + pctHeightElmOCR/2)*heightCalque/100;
    }

    // restituer les voisins de l'élemnt à editer
    var neighboursText = $('#' + targetElmToEdit.id).find('+ ul').find('.neighboursOk').text();
    neighbours = neighboursText.split(';');
    neighbours.forEach(function (voisinId) {
        $(voisinId).addClass('neighbour');
    });
    saveClassAddToElm['neighbour'] = neighbours;

    neighbours.forEach(function (t) {
        if(t !== ''){
            var neighActPrint = document.createElement('li');
            $(neighActPrint).text($('#' + t).find('+ ul').find('.nom').text()).appendTo('#neigbhours');
        }
    });
    $('#neigbhours').html('');


    // restituer les infos (records) de la bte de dialogue (pas de class list..., )

    var infosAll = $('#' + targetElmToEdit.id).find('+ ul').html();

    $('#record').find('ul').html(infosAll).find('li').removeClass('list-group-item p-2');

    // restituer le formulaire edit

    /*$('input[type="text"]').each(function () {
        //var nomInput = $(this).attr('name');

        $(this).val('jesus');
    });

    //var valOfElmType = $('#record').find('.typeElm').text();
    //$('input[value = valO]')*/

}

function deleteElmProccess(trace) {
    var idElm = trace.id;

    $.ajax({
        type:'POST',
        url: 'deleteElm.php',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        data: idElm,
        success: function(data){
            $('#'+ idElm ).remove().find('+ ul').remove();
            thingsToDo['close']();
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
        //divParent = document.createElement('div'),
        elm = document.createElement('div'),
        infos = document.createElement('ul');

    if (submissionCreer.typeElm === 'elmPoste'){
        heightElm = pctHeightElmPoste + '%';
        widthElm = pctWidthElmPoste + '%';

        $(elm).addClass('poste');
        if(submissionCreer.formPoste === 'rond') $(elm).addClass('rond');
        else $(elm).addClass('carre');

    }else {
        heightElm = pctHeightElmOCR + '%';
        widthElm = pctWidthElmOCR + '%';

        $(elm).addClass('OCR');
    }



    if(submissionCreer.neighboursOk) submissionCreer.neighboursOk = submissionCreer.neighboursOk.join(';');



    $(elm).css({'font-size': 'inherit', 'position':'absolute', 'left':submissionCreer.percXY[0], 'top':submissionCreer.percXY[1], 'width':widthElm, 'height':heightElm})
        .attr({'data-placement':'bottom', 'data-toggle':'popover','title':'Element réseau', 'data-trigger':'hover', 'id':newId})
        .appendTo('#calque');

    $(infos).html(
        '             <li class="list-group-item d-none p-2" >Nom : <i class="nom font-weight-bold text-info"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Type : <i class="typeElm font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Départ Actuel : <i class="departActuel font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Départ Installé : <i class="departInstall font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Puissance : <i class="powerPoste font-weight-bold"></i> MW</li>' +
        '             <li class="list-group-item d-none p-2" >Etat : <i class="theCommand font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Code : <i class="code font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Agence : <i class="nomAgence font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >DEX : <i class="nomDex font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Localisation : <i class="location font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Voisins : <i class="neighboursOk font-weight-bold"></i></li>' +
        '             <li class="list-group-item d-none p-2" >Ordre : <i class="ordre font-weight-bold"></i></li>'
    ).css('display','none').addClass('list-group').appendTo('#calque');


    //$(divParent).appendTo('#calque');

    $.each( submissionCreer, function (key, value) {
        $(infos).find('i').each(function () {
            if($(this).hasClass(key)){
                $(this).text(value);
                if(key !== 'ordre' && key !== 'neighboursOk'){
                    $(this).parent().removeClass('d-none');
                }
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
