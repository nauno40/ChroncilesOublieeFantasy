<?php

namespace App\Service;

use App\Entity\Tag;
use App\Repository\TagRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Résout des noms de tags bruts (saisis par un membre, sur son propre contenu) en entités
 * `Tag` réelles, en créant celles qui n'existent pas — normalisées (minuscules, espaces
 * réduits) pour qu'« Épique » et « épique » partagent le même tag plutôt que d'en faire
 * naître deux voisins. Bornes basses et volontairement simples (pas de liste blanche, pas
 * de modération) : le risque d'abus d'un tag libre reste faible face au coût d'un système
 * de curation que personne n'a demandé.
 */
final readonly class TagResolver
{
    private const MAX_TAGS = 10;
    private const MAX_LENGTH = 30;

    public function __construct(
        private TagRepository $tags,
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * @param string[] $rawNames
     *
     * @return Tag[]
     */
    public function resolve(array $rawNames): array
    {
        $normalized = [];
        foreach ($rawNames as $name) {
            if (!\is_string($name)) {
                continue;
            }
            $clean = mb_strtolower(trim(preg_replace('/\s+/', ' ', $name)));
            if ('' === $clean || mb_strlen($clean) > self::MAX_LENGTH) {
                continue;
            }
            $normalized[$clean] = true; // dédoublonne
        }
        $names = \array_slice(array_keys($normalized), 0, self::MAX_TAGS);

        $resolved = [];
        foreach ($names as $name) {
            $tag = $this->tags->findOneBy(['name' => $name]);
            if (null === $tag) {
                $tag = new Tag();
                $tag->setName($name);
                $this->em->persist($tag);
            }
            $resolved[] = $tag;
        }

        return $resolved;
    }
}
