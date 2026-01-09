<?php

namespace App\Repository;

use App\Entity\Voie;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Voie>
 *
 * @method Voie|null find($id, $lockMode = null, $lockVersion = null)
 * @method Voie|null findOneBy(array $criteria, array $orderBy = null)
 * @method Voie[]    findAll()
 * @method Voie[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class VoieRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Voie::class);
    }
}
