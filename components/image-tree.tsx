"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";

interface TreeNode {
  id: string;
  name: string;
  url: string;
  likesCount: number;
  commentsCount: number;
  visibility: 'public' | 'unlisted' | 'private';
  sourceImageId: string | null;
  transformationPrompt: string | null;
  generationDepth: number;
  rootImageId: string;
  createdAt: string;
}

type TreeNodeWithChildren = TreeNode & { children: TreeNodeWithChildren[] };

interface TreeData {
  rootImageId: string;
  tree: TreeNode[];
}

interface ImageTreeProps {
  imageId: string;
  currentImageId: string;
}

export default function ImageTree({ imageId, currentImageId }: ImageTreeProps) {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    async function fetchTree() {
      try {
        setLoading(true);
        const response = await fetch(`/api/images/${imageId}/tree`);
        if (!response.ok) {
          throw new Error('Failed to fetch tree');
        }
        const data = await response.json();
        setTreeData(data);
      } catch (err) {
        console.error('Error fetching tree:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tree');
      } finally {
        setLoading(false);
      }
    }

    fetchTree();
  }, [imageId]);

  // Build parent-child relationships
  const buildTree = (nodes: TreeNode[]): TreeNodeWithChildren[] => {
    const nodeMap = new Map<string, TreeNodeWithChildren>();

    // Initialize all nodes with children array
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build parent-child relationships
    const roots: TreeNodeWithChildren[] = [];
    nodes.forEach(node => {
      const nodeWithChildren = nodeMap.get(node.id)!;
      if (node.sourceImageId && nodeMap.has(node.sourceImageId)) {
        nodeMap.get(node.sourceImageId)!.children.push(nodeWithChildren);
      } else {
        roots.push(nodeWithChildren);
      }
    });

    return roots;
  };

  const handleNodeClick = (nodeId: string) => {
    // Preserve the current search params and add tab=tree
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('tab', 'tree');
    router.push(`/image/${nodeId}?${currentParams.toString()}`);
  };

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNodeWithChildren, depth: number = 0) => {
    const isCurrentImage = node.id === currentImageId;
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);

    return (
      <div key={node.id} className="relative min-w-0">
        {/* Node */}
        <div className="flex items-start gap-2 min-w-0">
          {/* Collapse/Expand Button */}
          {hasChildren && (
            <button
              onClick={(e) => toggleCollapse(node.id, e)}
              className="flex-shrink-0 mt-3 p-1 hover:bg-accent rounded transition-colors"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6 flex-shrink-0" />}

          <div
            className={`flex-1 min-w-0 flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
              isCurrentImage
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                : 'border-border hover:border-yellow-500/50'
            }`}
            onClick={() => handleNodeClick(node.id)}
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
              <Image
                src={node.url}
                alt={node.transformationPrompt || 'Image'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Gen {node.generationDepth}
                </span>
                {isCurrentImage && (
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-500 whitespace-nowrap">
                    Current
                  </span>
                )}
                {hasChildren && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    ({node.children.length})
                  </span>
                )}
              </div>
              {node.transformationPrompt ? (
                <p className="text-sm font-medium line-clamp-2 mb-1 break-words">
                  {node.transformationPrompt}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Original
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="whitespace-nowrap">{node.likesCount} likes</span>
                <span className="whitespace-nowrap">{node.commentsCount} comments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && !isCollapsed && (
          <div className="ml-4 mt-3 pl-3 border-l-2 border-border space-y-3 cursor-pointer hover:border-muted-foreground transition-colors min-w-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(node.id, e);
            }}
          >
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!treeData || treeData.tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <p className="text-sm text-muted-foreground">No transformation history</p>
      </div>
    );
  }

  const roots = buildTree(treeData.tree);

  return (
    <div className="p-4 space-y-4 overflow-x-hidden">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Transformation Tree</h3>
        <p className="text-xs text-muted-foreground">
          {treeData.tree.length} image{treeData.tree.length !== 1 ? 's' : ''} in this family tree
        </p>
      </div>
      <div className="space-y-4 overflow-x-hidden">
        {roots.map(root => renderNode(root))}
      </div>
    </div>
  );
}
