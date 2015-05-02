import {computedObservationAdapter} from '../src/observation-adapter';
import computed from 'computed';
import getEntityManager from './computed-setup';

describe('computed observation adapter', function() {
  var entityManager, memberType, repositoryType;
  beforeAll(() => {
    entityManager = getEntityManager();
    memberType = entityManager.metadataStore.getEntityType('Member');
    repositoryType = entityManager.metadataStore.getEntityType('Repository');
  });

  beforeEach(() => {
    entityManager.clear();
  });

  it('can construct the adapter', () => {
    var adapter = new computedObservationAdapter();
    expect(adapter).toBeDefined();
  });

  it('ignores entity properties that are not observable', () => {
    var adapter = new computedObservationAdapter(),
      entity = memberType.createEntity();
    expect(adapter.handlesProperty(entity, 'entityAspect')).toBe(false);
    expect(adapter.handlesProperty(entity, 'entityType')).toBe(false);
  });

  it('ignores pojo properties', () => {
    var adapter = new computedObservationAdapter(),
      entity = {
        foo: 'bar'
      };
    expect(adapter.handlesProperty(entity, 'foo')).toBe(false);
  });

  it('ignores undefined properties', () => {
    var adapter = new computedObservationAdapter(),
      entity = {};
    expect(adapter.handlesProperty(entity, 'foo')).toBe(false);
  });

  it('handles computed scalar properties', () => {
    var adapter = new computedObservationAdapter(),
      entity = memberType.createEntity();
    expect(adapter.handlesProperty(entity, 'id')).toBe(true);
  });

  it('handles non-scalar navigation properties', () => {
    var adapter = new computedObservationAdapter(),
      member = entityManager.createEntity(memberType, {
        id: 1
      }),
      repository = entityManager.createEntity(repositoryType, {
        id: 'aurelia/binding',
        memberId: 1
      });

    expect(member.repositories).toBeDefined();
    expect(member.repositories.constructor).toBe(Array);
    expect(member.repositories.length).toBe(1);
    var descriptor = Object.getPropertyDescriptor(member, 'repository');
    expect(descriptor).toBeUndefined();

    expect(adapter.handlesProperty(member, 'repositories')).toBe(false);
  });

  it('handles scalar navigation properties', () => {
    var adapter = new computedObservationAdapter(),
      member = entityManager.createEntity(memberType, {
        id: 1
      }),
      repository = entityManager.createEntity(repositoryType, {
        id: 'aurelia/binding',
        memberId: 1
      });

    expect(repository.member).toBeDefined();
    var descriptor = Object.getPropertyDescriptor(repository, 'member');
    expect(descriptor).toBeDefined();

    expect(adapter.handlesProperty(repository, 'member')).toBe(true);
  });

  it('handles non-scalar data properties', () => {
    var adapter = new computedObservationAdapter(),
      member = entityManager.createEntity(memberType, {
        id: 1
      }),
      repository = entityManager.createEntity(repositoryType, {
        id: 'aurelia/binding',
        memberId: 1,
        files: ['computed.js', 'aurelia.js']
      });

    expect(repository.files).toBeDefined();
    var descriptor = Object.getPropertyDescriptor(repository, 'files');
    expect(descriptor).toBeDefined();

    expect(adapter.handlesProperty(repository, 'files')).toBe(true);
  });


  it('handles detached entities', () => {
    var adapter = new computedObservationAdapter(),
      entity = memberType.createEntity({
        id: 0
      });
    expect(adapter.handlesProperty(entity, 'id')).toBe(true);
    expect(adapter.handlesProperty(entity, 'login')).toBe(true);
  });

  it('handles attached entities', () => {
    var adapter = new computedObservationAdapter(),
      entity = entityManager.createEntity(memberType, {
        id: 0
      });
    expect(adapter.handlesProperty(entity, 'id')).toBe(true);
    expect(adapter.handlesProperty(entity, 'login')).toBe(true);
  });

  it('returns observer matching property-observer interface', () => {
    var adapter = new computedObservationAdapter(),
      entity = entityManager.createEntity(memberType, {
        id: 0
      }),
      observer = adapter.getObserver(entity, 'id');
    expect(observer.propertyName).toBe('id');
    expect(Object.prototype.toString.call(observer.getValue)).toBe('[object Function]');
    expect(Object.prototype.toString.call(observer.setValue)).toBe('[object Function]');
    expect(Object.prototype.toString.call(observer.subscribe)).toBe('[object Function]');
  });

  it('reuses property observers', () => {
    var adapter = new computedObservationAdapter(),
      entity = entityManager.createEntity(memberType, {
        id: 0
      }),
      observer1 = adapter.getObserver(entity, 'id'),
      observer2 = adapter.getObserver(entity, 'id');
    expect(observer1).toBe(observer2);
  });

  describe('detached entity observation', function() {
    var adapter, entity, idObserver, disposeId, loginObserver, disposeLogin, change;
    beforeAll(() => {
      adapter = new computedObservationAdapter(),
      entity = memberType.createEntity({
        id: 0,
        login: 'foo'
      }),
      idObserver = adapter.getObserver(entity, 'id'),
      loginObserver = adapter.getObserver(entity, 'login');
    });

    it('is a detached entity', () => {
      expect(entity.entityAspect.entityState.isDetached()).toBe(true);
    });

    it('gets and sets value', () => {
      expect(idObserver.getValue()).toBe(entity.id);
      expect(loginObserver.getValue()).toBe(entity.login);
      entity.id = 1;
      entity.login = 'bar';
      expect(idObserver.getValue()).toBe(entity.id);
      expect(loginObserver.getValue()).toBe(entity.login);
      idObserver.setValue(0);
      loginObserver.setValue('foo');
      expect(entity.id).toBe(0);
      expect(entity.login).toBe('foo');
      expect(idObserver.getValue()).toBe(entity.id);
      expect(loginObserver.getValue()).toBe(entity.login);
    });

    it('subscribes', () => {
      disposeId = idObserver.subscribe((newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      });
      disposeLogin = loginObserver.subscribe((newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      });
      expect(Object.prototype.toString.call(disposeId)).toBe('[object Function]');
      expect(Object.prototype.toString.call(disposeLogin)).toBe('[object Function]');
    });

    it('tracks changes while subscribed', () => {
      change = null;
      entity.id = 1;
      expect(change && change.newValue === 1 && change.oldValue === 0).toBe(true);

      change = null;
      idObserver.setValue(2);
      expect(change && change.newValue === 2 && change.oldValue === 1).toBe(true);

      change = null;
      entity.login = 'bar';
      expect(change && change.newValue === 'bar' && change.oldValue === 'foo').toBe(true);

      change = null;
      loginObserver.setValue('baz');
      expect(change && change.newValue === 'baz' && change.oldValue === 'bar').toBe(true);
    });

    it('unsubscribes', () => {
      expect(entity.__computedObserver__.callbackCount).toBe(2);
      disposeId();
      expect(entity.__computedObserver__.callbackCount).toBe(1);
      disposeLogin();
      expect(entity.__computedObserver__.callbackCount).toBe(0);

      // todo: find out if disposing extra times should throw.
      disposeId();
      disposeLogin();
      expect(entity.__computedObserver__.callbackCount).toBe(0);
    });

    it('does not track changes while unsubscribed', () => {
      change = null;

      entity.id = 3;
      expect(change).toBe(null);

      idObserver.setValue(0);
      expect(change).toBe(null);

      entity.login = 'fizz';
      expect(change).toBe(null);

      change = null;
      loginObserver.setValue('foo');
      expect(change).toBe(null);
    });

    it('re-subscribes', () => {
      disposeId = idObserver.subscribe((newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      });
      disposeLogin = loginObserver.subscribe((newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      });
      expect(Object.prototype.toString.call(disposeId)).toBe('[object Function]');
      expect(Object.prototype.toString.call(disposeLogin)).toBe('[object Function]');
    });

    it('tracks changes after re-subscribing', () => {
      change = null;
      entity.id = 1;
      expect(change && change.newValue === 1 && change.oldValue === 0).toBe(true);

      change = null;
      idObserver.setValue(2);
      expect(change && change.newValue === 2 && change.oldValue === 1).toBe(true);

      change = null;
      entity.login = 'bar';
      expect(change && change.newValue === 'bar' && change.oldValue === 'foo').toBe(true);

      change = null;
      loginObserver.setValue('baz');
      expect(change && change.newValue === 'baz' && change.oldValue === 'bar').toBe(true);
    });
  });

  // todo: find way to reuse previous set of tests.
  describe('attached entity observation', function() {
    var adapter, entity, idObserver, disposeId, loginObserver, disposeLogin, change;
    beforeAll(() => {
      adapter = new computedObservationAdapter(),
      entity = entityManager.createEntity('Member', {
        id: 0,
        login: 'foo'
      }),
      idObserver = adapter.getObserver(entity, 'id'),
      loginObserver = adapter.getObserver(entity, 'login');
    });

    it('is a detached entity', () => {
      expect(entity.entityAspect.entityState.isDetached()).toBe(true);
    });

    it('gets and sets value', () => {
      expect(idObserver.getValue()).toBe(entity.id);
      expect(loginObserver.getValue()).toBe(entity.login);
      entity.id = 1;
      entity.login = 'bar';
      expect(idObserver.getValue()).toBe(entity.id);
      expect(loginObserver.getValue()).toBe(entity.login);
      idObserver.setValue(0);
      loginObserver.setValue('foo');
      expect(entity.id).toBe(0);
      expect(entity.login).toBe('foo');
      expect(idObserver.getValue()).toBe(entity.id);
      expect(loginObserver.getValue()).toBe(entity.login);
    });

    it('subscribes', () => {
      disposeId = idObserver.subscribe((newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      });
      disposeLogin = loginObserver.subscribe((newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      });
      expect(Object.prototype.toString.call(disposeId)).toBe('[object Function]');
      expect(Object.prototype.toString.call(disposeLogin)).toBe('[object Function]');
    });

    it('tracks changes while subscribed', () => {
      change = null;
      entity.id = 1;
      expect(change && change.newValue === 1 && change.oldValue === 0).toBe(true);

      change = null;
      idObserver.setValue(2);
      expect(change && change.newValue === 2 && change.oldValue === 1).toBe(true);

      change = null;
      entity.login = 'bar';
      expect(change && change.newValue === 'bar' && change.oldValue === 'foo').toBe(true);

      change = null;
      loginObserver.setValue('baz');
      expect(change && change.newValue === 'baz' && change.oldValue === 'bar').toBe(true);
    });

    it('unsubscribes', () => {
      expect(entity.__computedObserver__.callbackCount).toBe(2);
      disposeId();
      expect(entity.__computedObserver__.callbackCount).toBe(1);
      disposeLogin();
      expect(entity.__computedObserver__.callbackCount).toBe(0);

      // todo: find out if disposing extra times should throw.
      disposeId();
      disposeLogin();
      expect(entity.__computedObserver__.callbackCount).toBe(0);
    });

    it('does not track changes while unsubscribed', () => {
      change = null;

      entity.id = 3;
      expect(change).toBe(null);

      idObserver.setValue(0);
      expect(change).toBe(null);

      entity.login = 'fizz';
      expect(change).toBe(null);

      change = null;
      loginObserver.setValue('foo');
      expect(change).toBe(null);
    });

    it('re-subscribes', () => {
      disposeId = idObserver.subscribe((newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      });
      disposeLogin = loginObserver.subscribe((newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      });
      expect(Object.prototype.toString.call(disposeId)).toBe('[object Function]');
      expect(Object.prototype.toString.call(disposeLogin)).toBe('[object Function]');
    });

    it('tracks changes after re-subscribing', () => {
      change = null;
      entity.id = 1;
      expect(change && change.newValue === 1 && change.oldValue === 0).toBe(true);

      change = null;
      idObserver.setValue(2);
      expect(change && change.newValue === 2 && change.oldValue === 1).toBe(true);

      change = null;
      entity.login = 'bar';
      expect(change && change.newValue === 'bar' && change.oldValue === 'foo').toBe(true);

      change = null;
      loginObserver.setValue('baz');
      expect(change && change.newValue === 'baz' && change.oldValue === 'bar').toBe(true);
    });
  });
});
