//
// Stickstick Routing
//

executable.container.include('defaults/application/routing/');

router.capture(fixURL(resourcesBaseURL + '/data/note/{id}/'), '/data/note/');
