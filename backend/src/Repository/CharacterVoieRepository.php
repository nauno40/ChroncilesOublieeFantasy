<?php
// backend/src/Repository/CharacterVoieRepository.php
namespace App\Repository;

use App\Entity\CharacterVoie;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CharacterVoie>
 */
class CharacterVoieRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CharacterVoie::class);
    }
}
