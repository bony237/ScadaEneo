<?php
/**
 * Created by PhpStorm.
 * User: HP PC
 * Date: 23/12/2019
 * Time: 23:30
 */

$manager = new MongoDB\Driver\Manager('mongodb://127.0.0.1:27017');


$options = [
    'sort' => ['_id' => -1]
];

$filter = [];

$query = new MongoDB\Driver\Query($filter, $options);

$result = $manager->executeQuery('scadaEneo.stockElm', $query);

echo json_encode(iterator_to_array($result, false));
