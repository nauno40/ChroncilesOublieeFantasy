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
        yield MenuItem::linkToDashboard('Dashboard', 'fa fa-home');
        yield MenuItem::section('Users');
        yield MenuItem::linkToCrud('Users', 'fas fa-user', \App\Entity\User::class);
        yield MenuItem::section('Game Data');
        yield MenuItem::linkToCrud('Races', 'fas fa-dna', \App\Entity\Race::class);
        yield MenuItem::linkToCrud('Families', 'fas fa-users', \App\Entity\Family::class);
        yield MenuItem::linkToCrud('Profiles', 'fas fa-id-card', \App\Entity\Profile::class);
        yield MenuItem::linkToCrud('Voies', 'fas fa-road', \App\Entity\Voie::class);
        yield MenuItem::linkToCrud('Capabilities', 'fas fa-magic', \App\Entity\Capability::class);
        yield MenuItem::linkToCrud('Creature Families', 'fas fa-dragon', \App\Entity\CreatureFamily::class);
        yield MenuItem::linkToCrud('Creatures', 'fas fa-paw', \App\Entity\Creature::class);
        yield MenuItem::linkToCrud('Equipment', 'fas fa-shield-alt', \App\Entity\Equipment::class);
    }
}
