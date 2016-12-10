import {
    MeshPhongMaterial, AmbientLight, Mesh, MultiMaterial, ObjectLoader,
    PerspectiveCamera, Scene, SphereGeometry, Vector3, WebGLRenderer,
    PointLight, PointLightHelper, FaceNormalsHelper, TextureLoader,
} from 'three';
import { easeOutExpo as ease, } from 'easing-utils';

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
    
    function animate() {

        if( opacityTween > 0 ) {
            opacityTween -= 0.02;
            container.style.opacity = 1 - opacityTween;
            logoElement.style.opacity = opacityTween;
        }

        obj.rotation.x = 0.1 * Math.sin( Date.now() * 0.001 );
        obj.rotation.y = 0.02 * Math.sin( ( 1 + Date.now() ) * 0.0005 );

        if( spinning ) {

            const { rotation } = scene.children[ 3 ].children[ 1 ];
            const elapsed = ( Date.now() - spinTimeStart ) / spinTime;
            rotation.z = spinStart + ( ease( elapsed ) * Math.PI * 2 );

            if( elapsed >= 1 ) {
                spinning = false;
                rotation.z = spinStart;
            }

        }

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

    requestAnimationFrame( animate );

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
            //console.log( 'child.faceVertexUvs.length:', child.geometry.faceVertexUvs );
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

    scene.add( obj );

});
