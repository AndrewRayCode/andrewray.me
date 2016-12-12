import {
    MeshPhongMaterial, AmbientLight, Mesh, MultiMaterial, ObjectLoader,
    PerspectiveCamera, Scene, SphereGeometry, Vector3, WebGLRenderer,
    PointLight, PointLightHelper, FaceNormalsHelper, TextureLoader,
    Geometry, Color, Object3D, Euler, CylinderGeometry, Math as ThreeMath
} from 'three';
import {
    easeOutCirc, easeOutExpo, easeOutSine, easeOutBack,
} from 'easing-utils';
import { MeshLine, MeshLineMaterial, } from 'meshline-andrewray';

require('./bootstra-grid.scss');
require('./main.scss');

const height = 95;
const width = 438;

const logoElement = document.querySelector( '.blog-title' );
const wrapper = document.querySelector( '.title-link' );

let opacityTween = 1;
logoElement.style.opacity = opacityTween;

const aoMapIntensity = 0.15;

const objLoader = new ObjectLoader();
const textureLoader = new TextureLoader();
const spinTime = 1000;

let spinning = false;

const STRAND_TWEEN_IN_TIME_MS = 2000;
const STRAND_VISIBLE_TIME = 3000;
const STRAND_FADE_OUT_TIME = 1000;
const TOTAL_STRAND_VISIBLE_TIME = (
    STRAND_TWEEN_IN_TIME_MS + STRAND_VISIBLE_TIME + STRAND_FADE_OUT_TIME
);

function randInt( min, max ) {
    return Math.floor( Math.random() * ( ( max - min ) + 1 ) ) + min;
}

function randFloat( min, max ) {
    return ( Math.random() * ( max - min ) ) + min;
}

const lightColors = [
    new Color( 255, 0, 0 ),
    new Color( 0, 255, 0 ),
    new Color( 0, 0, 255 ),
];

Promise.all([
    new Promise( ( resolve, reject ) =>
        textureLoader.load( require( './ray-ambient.jpg' ), t => resolve( t ) )
    ),
    new Promise( ( resolve, reject ) =>
        objLoader.load( require( './andrew-ray-3d-logo.json' ), t => resolve( t ) )
    ),
]).then( values => {
    const aoMap = values[ 0 ];
    const obj = values[ 1 ];
    const spinStart = obj.children[ 1 ].rotation.z;
    let spinTimeStart = 0;
    
    function animate( elapsed ) {

        const ms = elapsed;

        if( opacityTween > 0 ) {
            opacityTween -= 0.02;
            container.style.opacity = 1 - opacityTween;
            logoElement.style.opacity = opacityTween;
        }

        obj.rotation.x = 0.1 * Math.sin( Date.now() * 0.001 );
        obj.rotation.y = 0.02 * Math.sin( ( 1 + Date.now() ) * 0.0005 );

        if( spinning ) {

            const { rotation, } = aLetter;
            const spinPercent = ( Date.now() - spinTimeStart ) / spinTime;
            rotation.z = spinStart + ( easeOutSine( spinPercent ) * Math.PI * 2 );

            if( elapsed >= 1 ) {
                spinning = false;
                rotation.z = spinStart;
            }

        }

        lines.forEach( ( line, index ) => {

            const { bulbs, } = line;

            const offsetTime = (
                ms + ( ( index / lines.length ) * TOTAL_STRAND_VISIBLE_TIME )
            ) % TOTAL_STRAND_VISIBLE_TIME;

            const percentAlong = offsetTime / TOTAL_STRAND_VISIBLE_TIME;
            const percentFadedIn = Math.min(
                offsetTime / STRAND_TWEEN_IN_TIME_MS, 1
            );

            const isFadingOut = offsetTime > STRAND_TWEEN_IN_TIME_MS + STRAND_VISIBLE_TIME;
            const percentFadedOut = Math.max(
                ( offsetTime - ( STRAND_TWEEN_IN_TIME_MS + STRAND_VISIBLE_TIME ) ) / STRAND_FADE_OUT_TIME,
                0
            );

            line.lineMesh.material.uniforms.visibility.value = percentFadedIn;
            line.lineMesh.material.uniforms.opacity.value = isFadingOut ? 1 - percentFadedOut : 1;

            bulbs.forEach( ( bulbData, bIndex ) => {
                const { bulb, base, } = bulbData;

                const percentVisible = ThreeMath.clamp(
                    ( percentFadedIn - ( bIndex / bulbs.length ) ) * 4,
                    0, 1
                );

                if( percentVisible <= 1 ) {
                    bulbData.group.scale.copy(
                        new Vector3( 1, 1, 1 ).multiplyScalar( easeOutBack( percentVisible, 5 ) )
                    );
                }

                base.material.opacity = isFadingOut ? 1 - percentFadedOut : percentVisible;
                bulb.material.opacity = isFadingOut ? 1 - percentFadedOut : percentVisible;

            });

            //bulbs.push({
                //on: false,
                //color,
                //group: bulbGroup,
            //});

        });

        requestAnimationFrame( animate );
        renderer.render( scene, camera );
    }

    function spinNow() {
        if( !spinning ) {
            spinTimeStart = Date.now();
            spinning = true;
        }
    }

    setInterval( spinNow, 10000 );

    wrapper.addEventListener( 'mouseenter', spinNow );

    const container = document.createElement( 'div' );
    container.classList.add( 'render-wrap' );
    container.style.width = `${ width }px`;
    container.style.height = `${ height }px`;
    container.style.opacity = 1 - opacityTween;
    wrapper.appendChild( container );

    const renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    container.appendChild( renderer.domElement );

    const scene = new Scene();

    const camera = new PerspectiveCamera( 30, width / height, 0.001, 10000 );
    camera.position.x = 0;
    camera.position.y = 2.3;
    camera.position.z = 0;
    camera.up = new Vector3( 0, 0, 1 );
    camera.lookAt( new Vector3( 0, 0, 0 ) );
    scene.add( camera );

    // ( color, intensity, distance, decay )
    const light = new PointLight( 0xffffff, 1, 100, 1 );
    light.position.set( 0, 10, 0 );
    scene.add( light );

    scene.add( new AmbientLight( 0xDDDDDD ) );

    const lines = [];

    const totalLines = 1;
    const taperStrength = 10;
    const bulbsPerStrand = 9;
    const yOffset = -1;
    const bulbRadius = 0.06;
    const bulbScale = new Vector3( 1, 1, 2 );
    const baseHeight = 0.4;
    const baseRadius = 0.1;
    const baseTaper = 0.5;

    for( let j = 0; j < totalLines; j += 1 ) {

        const vertexGeometry = new Geometry();

        const baseColor = new Color( 0, randFloat( 0.3, 0.5 ), 0 );
        const seed = randFloat( 0, 10 );
        const lineLength = randFloat( 4, 7 );
        const lineSteps = 100;
        const radius = randFloat( 0.5, 0.8 );
        const coils = randFloat( 1, 5 );

        const bulbs = [];
        const lights = [];

        // Build the spiral geometry
        for( let i = 0; i < lineSteps; i += 1 ) {

            const position = new Vector3(
                ( -( i / lineSteps ) * lineLength ) + ( lineLength / 2 ),
                ( radius * Math.sin( seed + ( ( i / lineSteps ) * ( Math.PI * 2 * coils ) ) ) ) + yOffset,
                radius * Math.cos( seed + ( ( i / lineSteps ) * ( Math.PI * 2 * coils ) ) ),
            );
            vertexGeometry.vertices.push( position );

        }

        const line = new MeshLine();
        line.setGeometry( vertexGeometry, p => 1 - ( Math.abs( ( p * 2 ) - 1 ) ** taperStrength ) );
        const lineMaterial = new MeshLineMaterial({
            transparent: true,
            lineWidth: 0.05,
            color: baseColor,
        });
        const lineMesh = new Mesh( line.geometry, lineMaterial );

        scene.add( lineMesh );

        for( let i = 0; i < bulbsPerStrand; i += 1 ) {

            const percentAlong = ( i / bulbsPerStrand ) + ( ( 1 / bulbsPerStrand ) * 0.5 );
            const color = i % lightColors.length;

            const position = new Vector3(
                ( -percentAlong * lineLength ) + ( lineLength / 2 ),
                ( radius * Math.sin( seed + ( percentAlong * ( Math.PI * 2 * coils ) ) ) ) + yOffset,
                radius * Math.cos( seed + ( percentAlong * ( Math.PI * 2 * coils ) ) ),
            );

            const bulbMaterial = new MeshPhongMaterial({
                opacity: 0,
                transparent: true,
                color: lightColors[ color ],
            });
            const bulbGeometry = new SphereGeometry( bulbRadius, 8, 8 );
            const bulbMesh = new Mesh( bulbGeometry, bulbMaterial );
            bulbMesh.position.z = bulbRadius * bulbScale.z;
            bulbMesh.scale.copy( bulbScale );

            const baseGeometry = new CylinderGeometry( baseRadius, baseRadius * baseTaper, baseHeight * bulbRadius * 4 );
            const baseMaterial = new MeshPhongMaterial({
                opacity: 0,
                transparent: true,
                color: baseColor
            });
            const baseMesh = new Mesh( baseGeometry, baseMaterial, );
            baseMesh.rotation.copy( new Euler(
                Math.PI / 2,
                0,
                0,
            ) );

            const bulbGroup = new Object3D();
            bulbGroup.position.copy( position );
            bulbGroup.rotation.copy(
                new Euler(
                    randFloat( -Math.PI, Math.PI ),
                    randFloat( -Math.PI, Math.PI ),
                    randFloat( -Math.PI, Math.PI ),
                )
            );

            bulbGroup.add( bulbMesh );
            bulbGroup.add( baseMesh );

            scene.add( bulbGroup );
            bulbs.push({
                on: false,
                color,
                group: bulbGroup,
                bulb: bulbMesh,
                base: baseMesh,
            });

        }

        lines.push({
            seed,
            lineMesh,
            lights,
            bulbs
        });

    }

    const mainMaterial = new MultiMaterial([
        new MeshPhongMaterial({
            aoMap,
            aoMapIntensity,
            shininess: 100,
            specular: 0xffffff,
            color: 0xFFFFFF,
        }),
        new MeshPhongMaterial({
            aoMap,
            aoMapIntensity,
            shininess: 100,
            specular: 0xffffff,
            color: 0x5C992E
        }),
    ]);

    const aMaterial = new MultiMaterial([
        new MeshPhongMaterial({
            aoMap,
            aoMapIntensity,
            shininess: 100,
            specular: 0xffffff,
            color: 0xFF5933
        }),
        new MeshPhongMaterial({
            aoMap,
            aoMapIntensity,
            shininess: 100,
            specular: 0xffffff,
            color: 0xFFFFFF
        }),
    ]);

    obj.traverse( child => {
        if( child instanceof Mesh ) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.geometry.faces.forEach( face => {
                const { x, y, z, } = face.normal;
                face.normal = new Vector3( x, -z, y, );
                face.vertexNormals = face.vertexNormals.map(
                    vn => new Vector3( vn.x, -vn.z, vn.y )
                );
                face.normal.normalize();
            });
            child.normalsNeedUpdate = true;
            child.verticesNeedUpdate = true;

        }
    });

    obj.children[ 0 ].material = mainMaterial;
    obj.children[ 1 ].material = aMaterial;
    const aLetter = obj.children[ 1 ];

    obj.position.y -= 1;
    obj.scale.multiplyScalar( 1.5 );
    scene.add( obj );

    requestAnimationFrame( animate );

});
