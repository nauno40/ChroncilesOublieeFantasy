<?php

namespace App\Controller\Admin;

use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use Symfony\Component\Routing\Attribute\Route;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\Response;

#[AdminDashboard(routePath: '/admin', routeName: 'admin')]
class DashboardController extends AbstractDashboardController
{
    #[Route('/admin', name: 'admin')]
    public function index(): Response
    {
        $adminUrlGenerator = $this->container->get(\EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator::class);
        return $this->redirect($adminUrlGenerator->setController(CreatureCrudController::class)->generateUrl());
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()
            ->setTitle('App');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Tableau de bord', 'fa fa-home');

        yield MenuItem::section('Comptes');
        yield MenuItem::linkToCrud('Utilisateurs', 'fas fa-user', \App\Entity\User::class);

        yield MenuItem::subMenu('Compendium', 'fas fa-book')->setSubItems([
            MenuItem::linkToCrud('Peuples', 'fas fa-dna', \App\Entity\Race::class),
            MenuItem::linkToCrud('Familles de profils', 'fas fa-users', \App\Entity\Family::class),
            MenuItem::linkToCrud('Profils', 'fas fa-id-card', \App\Entity\Profile::class),
            MenuItem::linkToCrud('Voies', 'fas fa-road', \App\Entity\Voie::class),
            MenuItem::linkToCrud('Capacités', 'fas fa-magic', \App\Entity\Capability::class),
            MenuItem::linkToCrud('Équipement', 'fas fa-shield-alt', \App\Entity\Equipment::class),
            MenuItem::linkToCrud('Matériel', 'fas fa-toolbox', \App\Entity\Material::class),
            MenuItem::linkToCrud('Nourriture', 'fas fa-drumstick-bite', \App\Entity\Food::class),
            MenuItem::linkToCrud('Hébergement', 'fas fa-bed', \App\Entity\Lodging::class),
            MenuItem::linkToCrud('Montures', 'fas fa-horse', \App\Entity\Mount::class),
            MenuItem::linkToCrud('États préjudiciables', 'fas fa-heart-crack', \App\Entity\HarmfulState::class),
            MenuItem::linkToCrud('Poisons', 'fas fa-flask', \App\Entity\Poison::class),
            MenuItem::linkToCrud('Pièges', 'fas fa-bomb', \App\Entity\Trap::class),
        ]);

        yield MenuItem::subMenu('Bestiaire', 'fas fa-dragon')->setSubItems([
            MenuItem::linkToCrud('Familles de créatures', 'fas fa-sitemap', \App\Entity\CreatureFamily::class),
            MenuItem::linkToCrud('Créatures', 'fas fa-paw', \App\Entity\Creature::class),
            MenuItem::linkToCrud('Voies de créature', 'fas fa-route', \App\Entity\CreatureVoie::class),
        ]);

        yield MenuItem::subMenu('Contenu communautaire', 'fas fa-users-rays')->setSubItems([
            MenuItem::linkToCrud('Créations partagées', 'fas fa-scroll', \App\Entity\HomebrewEntry::class),
            MenuItem::linkToCrud('Monstres maison', 'fas fa-ghost', \App\Entity\CustomCreature::class),
        ]);

        // Données appartenant aux utilisateurs : consultation et suppression seulement.
        yield MenuItem::subMenu('Données des utilisateurs', 'fas fa-lock')->setSubItems([
            MenuItem::linkToCrud('Campagnes', 'fas fa-map', \App\Entity\Campaign::class),
            MenuItem::linkToCrud('Adhésions', 'fas fa-user-plus', \App\Entity\CampaignMembership::class),
            MenuItem::linkToCrud('Quêtes', 'fas fa-flag', \App\Entity\Quest::class),
            MenuItem::linkToCrud('Indices', 'fas fa-magnifying-glass', \App\Entity\Clue::class),
            MenuItem::linkToCrud('Séances', 'fas fa-calendar-day', \App\Entity\Session::class),
            MenuItem::linkToCrud('Rencontres', 'fas fa-skull', \App\Entity\Encounter::class),
            MenuItem::linkToCrud('Personnages', 'fas fa-user-shield', \App\Entity\Character::class),
            MenuItem::linkToCrud('Voies de personnage', 'fas fa-diagram-project', \App\Entity\CharacterVoie::class),
        ]);
    }
}
