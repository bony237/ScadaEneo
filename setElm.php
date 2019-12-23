<?php
/**
 * Created by PhpStorm.
 * User: HP PC
 * Date: 20/12/2019
 * Time: 19:53
 */

$idToSet = '';
$json_obj = json_decode(file_get_contents('php://input'));

//var_dump($json_obj);

foreach ($json_obj as $key => $value){
    if($key === 'targetId'){
        $idToSet = $value;
        unset($json_obj -> targetId);
    }
}

$manager = new MongoDB\Driver\Manager('mongodb://127.0.0.1:27017');

$bulk = new MongoDB\Driver\BulkWrite();

$bulk -> update(
    ['_id' => new MongoDB\BSON\ObjectID($idToSet)],
    ['$set' => $json_obj]
);

$writeConcern = new MongoDB\Driver\WriteConcern(MongoDB\Driver\WriteConcern::MAJORITY, 100);

$manager->executeBulkWrite('scadaEneo.stockElm', $bulk, $writeConcern);

//var_dump($json_obj);

//$idToSet