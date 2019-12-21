<?php
/**
 * Created by PhpStorm.
 * User: HP PC
 * Date: 18/12/2019
 * Time: 16:58
 */

$json_obj = json_decode(file_get_contents('php://input'));

$manager = new MongoDB\Driver\Manager('mongodb://127.0.0.1:27017');

//var_dump($manager);

$bulk = new MongoDB\Driver\BulkWrite();

$item = $bulk->insert($json_obj);

$writeConcern = new MongoDB\Driver\WriteConcern(MongoDB\Driver\WriteConcern::MAJORITY, 100);

$manager->executeBulkWrite('scadaEneo.stockElm', $bulk, $writeConcern);

foreach($item as $key => $value){
    if($key == 'oid')   echo $value;
}