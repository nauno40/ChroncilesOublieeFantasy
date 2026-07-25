<?php

namespace App\Repository;

use App\Entity\HomebrewEntry;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<HomebrewEntry>
 */
class HomebrewEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HomebrewEntry::class);
    }
}
