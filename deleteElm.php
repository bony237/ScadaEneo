<?php
/**
 * Created by PhpStorm.
 * User: HP PC
 * Date: 20/12/2019
 * Time: 16:24
 */

$idToDel = file_get_contents('php://input');

$manager = new MongoDB\Driver\Manager('mongodb://127.0.0.1:27017');

$bulk = new MongoDB\Driver\BulkWrite();

$bulk->delete(['_id' => new MongoDB\BSON\ObjectID($idToDel)], ['limit' => 1]);

$writeConcern = new MongoDB\Driver\WriteConcern(MongoDB\Driver\WriteConcern::MAJORITY, 100);

$manager->executeBulkWrite('scadaEneo.stockElm', $bulk, $writeConcern);
