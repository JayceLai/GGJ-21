import { _decorator, Component, Node, Vec3, Material, MeshRenderer, ccenum, Texture2D, Vec4 } from 'cc';
import { RigidCharacter } from './RigidCharacter';
const { ccclass, property, menu } = _decorator;

const vel = new Vec3();

enum CharacterStates {
    RUNNING,
    JUMPING,
    SLIDING,
    GLIDING,
}
ccenum(CharacterStates);

enum PlaneStates {
    HIDDEN,
    GLIDING_START,
    GLIDING_END,
}
ccenum(PlaneStates);

@ccclass('SequenceAnimationInfo')
class SequenceAnimationInfo {
    @property(Texture2D)
    texture: Texture2D = null;

    @property(Vec4)
    params = new Vec4(4.1, 4, 0, 0);

    @property
    playbackSpeed = 1;
}

@ccclass('AnimationStateMachine')
class AnimationStateMachine {
    @property(MeshRenderer)
    model: MeshRenderer = null;

    @property([SequenceAnimationInfo])
    animInfo: SequenceAnimationInfo[] = [];

    state = 0;
    stagingParam = new Vec4();
    playbackSpeed = 1;
}

@ccclass('Character.RigidCharacterAnimation')
@menu('demo/character/RigidCharacterAnimation')
export class RigidCharacterAnimation extends Component {
    @property(RigidCharacter)
    character: RigidCharacter = null!;

    @property(AnimationStateMachine)
    characterASM = new AnimationStateMachine();
    @property(AnimationStateMachine)
    planeASM = new AnimationStateMachine();

    update (dt: number) {
        this.character.getVelocity(vel);
        this.setFrontDirection(this.characterASM.model.node, vel.z);
        this.setFrontDirection(this.planeASM.model.node, vel.z);
        if (this.character.onGround) {
            this.setState(CharacterStates.RUNNING);
        } else {
            this.setState(CharacterStates.JUMPING);
        }

        // update time
        this.planeASM.stagingParam.w += this.planeASM.playbackSpeed * 0.03;
        this.planeASM.model.material.setProperty('seqAnimParams', this.planeASM.stagingParam);
        this.characterASM.stagingParam.w += this.characterASM.playbackSpeed * 0.03;
        this.characterASM.model.material.setProperty('seqAnimParams', this.characterASM.stagingParam);
    }

    setFrontDirection (node: Node, dir: number) {
        const scale = node.scale;
        node.setScale(Math.abs(scale.x) * (dir < -0.1 ? -1 : 1), scale.y, scale.z);
    }

    setState (state: CharacterStates) {
        if (this.characterASM.state !== state) {
            const characterAnim = this.characterASM.animInfo[state];
            this.characterASM.model.material.setProperty('mainTexture', characterAnim.texture);
            Vec4.copy(this.characterASM.stagingParam, characterAnim.params);
            this.characterASM.playbackSpeed = characterAnim.playbackSpeed;
            this.characterASM.state = state;
        }

        const planeState = state === CharacterStates.GLIDING ? PlaneStates.GLIDING_START : PlaneStates.GLIDING_END;
        if (this.planeASM.state !== planeState) {
            const planeAnim = this.planeASM.animInfo[planeState];
            this.planeASM.model.material.setProperty('mainTexture', planeAnim.texture);
            Vec4.copy(this.planeASM.stagingParam, planeAnim.params);
            this.planeASM.playbackSpeed = planeAnim.playbackSpeed;
            this.planeASM.state = planeState;
        }
    }
}
