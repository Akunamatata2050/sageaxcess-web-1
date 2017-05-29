'use strict';
angular
    .module('theme.core.monitoring_diagram_directives', [])
        .directive('monitoring', function () {
            return {
                restrict: 'A',
                scope: {
                    data: '=',
                },
                link: function (scope, ele) {
                    var svg,
                        mainG,
                        tree,
                        linkDiagonal;

                    init();

                    scope.$watchGroup(['data'], function(){
                        update();
                    });

                    function init() {
                        svg = d3.select(ele[0]).append('svg');
                        mainG = svg.append('g');
                        tree = d3.layout.tree();
                        linkDiagonal = d3.svg.diagonal().projection(function(d){ return [d.y, d.x]; });
                    }

                    function update() {
                        var size = [500, 500],
                            treeNodes,
                            treeLinks,
                            nodes,
                            links;
 
                        tree.size(size);

                        treeNodes = tree.nodes(scope.data);
                        treeNodes.splice(0, 1);
                        treeLinks = tree.links(treeNodes);

                        links = mainG.selectAll('.link').data(treeLinks);
                        links.enter().append('path')
                            .attr({'class':'link', 'fill':'none', 'd':linkDiagonal});

                        nodes = mainG.selectAll('.node').data(treeNodes);
                        nodes.enter().append('g').attr({'class':'node', 'transform':function(d){ return 'translate(' + [d.y, d.x] + ')'; }}).each(function(d){
                            var th = d3.select(this);
                            th.append('circle').attr({'r':5});
                            th.append('text').text(d.name).attr({'x':15, 'dominant-baseline':'middle'});
                        });

                        links.exit().remove();
                        nodes.exit().remove();

                        svg.style({'display':'inline-block', 'width':'100%', 'height':size[1] + 'px'});
                    }

                    // var chart = d3.select(ele[0]).append('svg')
                    //     .attr('width', 500)
                    //     .attr('height', 500)
                    // .append('g')
                    //     .attr('transform', 'translate(50, 50)');
                    
                    // scope.$watchGroup(['data'], function(){
                    //     update();
                    // });
                    
                    // var tree = d3.layout.tree()
                    //     .size([400, 400]);

                    // function update(data) {
                    //     var nodes = tree.nodes(scope.data);
                    //         nodes.splice(0, 1);
                    //     var links = tree.links(nodes);
                        
                    //     var nodes = chart.selectAll('.node')
                    //         .data(nodes).enter()
                    //         .append('g')
                    //         .attr('class', 'node')
                    //         .attr('transform', function(d){ return 'translate(' + [d.y, d.x] + ')'; }); // flip x and y of nodes

                    //     nodes.append('circle')
                    //         .attr('r', 5)
                    //         .attr('fill', 'steelblue');
                    //     nodes.append('text')
                    //         .text(function(d){ return d.name; });

                    //     var diagonal = d3.svg.diagonal()
                    //         .projection(function(d){ return [d.y, d.x]; }); // flip x and y of links

                    //     chart.selectAll('.link')
                    //         .data(links).enter()
                    //         .append('path')
                    //         .attr('class', 'link')
                    //         .attr('fill', 'none').attr('stroke', '#ADADAD')
                    //         .attr('d', diagonal);
                    // };
                }
            };
    });