<?php

namespace App\Repository;

use App\Entity\Capability;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Capability>
 *
 * @method Capability|null find($id, $lockMode = null, $lockVersion = null)
 * @method Capability|null findOneBy(array $criteria, array $orderBy = null)
 * @method Capability[]    findAll()
 * @method Capability[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CapabilityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Capability::class);
    }
}
